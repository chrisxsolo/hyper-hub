// Server-side Claude vision integration for product/price scanning. Claude's job
// is RECOGNITION and structured extraction from a photo of a product package,
// Costco shelf label, price tag, or barcode — never to invent data it can't see.
// Uncertain fields are flagged in `lowConfidenceFields` so the review screen can
// highlight them. Authoritative confirmation always comes from the owner.
//
// Server-only: imported solely by the scan route handler.

import Anthropic from "@anthropic-ai/sdk";
import { scannedProductSchema } from "./schemas";
import type { ScannedProduct } from "./types";

const MODEL = process.env.PRODUCT_SCAN_MODEL || process.env.NUTRITION_MODEL || "claude-opus-4-8";

// Field descriptions double as extraction instructions — Claude fills each one.
const PROPERTIES = {
  name: { type: ["string", "null"], description: "Full product name as printed, e.g. 'Kirkland Signature Boneless Skinless Chicken Breast'. Null if unreadable." },
  brand: { type: ["string", "null"], description: "Brand, e.g. 'Kirkland Signature', 'Tillamook'. Null if not visible." },
  variant: { type: ["string", "null"], description: "Variant/flavor/cut, e.g. 'Boneless Skinless', 'Sharp Cheddar', '2% Reduced Fat'. Null if none." },
  category: { type: ["string", "null"], description: "Best-fit aisle: Produce, Meat & Seafood, Dairy & Eggs, Frozen, Bakery, Pantry, Snacks, Beverages, Household, Health, or Other." },
  barcode: { type: ["string", "null"], description: "The UPC/EAN — read the human-readable DIGITS printed under the barcode (do not guess the bars). Null if no barcode digits are legible." },
  costcoItemNumber: { type: ["string", "null"], description: "The Costco item number from a shelf label (usually a 6–7 digit number near the top of the label). Null if not a Costco label or not visible." },
  packageCount: { type: ["number", "null"], description: "Number of individual items in the pack (24 eggs → 24, 6-pack → 6). Null for a single weighed item." },
  packageSize: { type: ["number", "null"], description: "Numeric size of the package or each unit (e.g. 16 for '16 oz'). Null if unknown." },
  packageUnit: { type: ["string", "null"], description: "Unit for packageSize: oz, lb, ct, fl oz, ml, L, g, kg. Null if unknown." },
  totalWeight: { type: ["number", "null"], description: "Total net weight as a number (e.g. 6.71 for '6.71 lb'). Use this for meat/produce/cheese sold by weight." },
  weightUnit: { type: ["string", "null"], description: "Unit for totalWeight: 'lb' or 'oz' (or g/kg). Null if not weight-based." },
  totalVolume: { type: ["number", "null"], description: "Total volume as a number for liquids. Null if not volume-based." },
  volumeUnit: { type: ["string", "null"], description: "Unit for totalVolume: 'fl oz', 'L', 'ml', 'gal'. Null if not volume-based." },
  totalPrice: { type: ["number", "null"], description: "The full package price as a number, e.g. 26.42 for '$26.42'. Null if no price is visible." },
  pricePerLb: { type: ["number", "null"], description: "Price per pound IF printed on the label, e.g. 3.94 for '$3.94/lb'. Null if not printed (it will be computed)." },
  pricePerOz: { type: ["number", "null"], description: "Price per ounce IF printed. Null otherwise." },
  pricePerItem: { type: ["number", "null"], description: "Price per item IF printed. Null otherwise." },
  storeName: { type: ["string", "null"], description: "Store name if visible, e.g. 'Costco'. Null otherwise." },
  storeLocation: { type: ["string", "null"], description: "Store location/warehouse if visible, e.g. 'Antioch'. Null otherwise." },
  sourceType: { type: "string", enum: ["package", "shelf_label", "barcode", "receipt", "manual", "other"], description: "What kind of image this is." },
  lowConfidenceFields: { type: "array", items: { type: "string" }, description: "Names of any fields above whose value you are NOT confident about (blurry, partially obscured, ambiguous). Use the exact property names, e.g. ['barcode','totalWeight']." },
  confidence: { type: "number", description: "0–1 overall confidence in this extraction." },
  notes: { type: ["string", "null"], description: "Anything notable: instant-savings amount, sale expiration, or why a field was hard to read. Null if nothing." },
} as const;

const TOOL = {
  name: "record_scanned_product",
  description: "Record the structured product and price information extracted from the image.",
  input_schema: {
    type: "object" as const,
    properties: PROPERTIES,
    required: Object.keys(PROPERTIES),
    additionalProperties: false,
  },
};

const SYSTEM = [
  "You extract structured product and price information from a single photo of a grocery item — a product package, a Costco shelf/price label, a price tag, or a barcode.",
  "",
  "Rules:",
  "- Report ONLY what you can actually read in the image. Never invent a name, price, weight, barcode, or item number.",
  "- For any field you cannot read with confidence, set it to null AND add its property name to lowConfidenceFields.",
  "- Read prices exactly as printed. Distinguish the full package price (totalPrice) from any per-unit price ($/lb, $/oz, each) printed on the label.",
  "- Read the human-readable digits printed beneath a barcode for `barcode`; do not attempt to decode the bars themselves.",
  "- Costco shelf labels show an item number (often 6–7 digits) near the top — capture it as costcoItemNumber.",
  "- For items sold by weight (meat, produce, cheese), set totalWeight + weightUnit. For multipacks (eggs, drinks, bars, paper goods), set packageCount.",
  "- Choose the single best-fit category from the provided list.",
  "- Do not compute unit prices yourself unless they are printed on the label — they are computed downstream.",
  "Call record_scanned_product exactly once.",
].join("\n");

export class MissingApiKeyError extends Error {}

export async function scanProduct(opts: {
  base64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
}): Promise<ScannedProduct> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new MissingApiKeyError(
      "ANTHROPIC_API_KEY is not configured on the server. Add it to .env.local (and your deployment env) to enable product scanning.",
    );
  }
  const client = new Anthropic({ apiKey });

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM,
    tools: [TOOL],
    tool_choice: { type: "tool", name: TOOL.name },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: opts.mediaType, data: opts.base64 },
          },
          {
            type: "text",
            text: "Extract the product and price details from this image. Flag anything you are unsure about.",
          },
        ],
      },
    ],
  });

  const block = resp.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("Claude did not return a structured product.");
  }

  const parsed = scannedProductSchema.safeParse(block.input);
  if (!parsed.success) {
    throw new Error("Claude returned an unexpected shape: " + parsed.error.message);
  }
  return parsed.data as ScannedProduct;
}
