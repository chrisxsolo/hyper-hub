// Combined classify + extract for the multi-photo scanner. In ONE vision call
// per image, Claude decides whether the photo is a Nutrition Facts panel or a
// product/price/barcode/receipt, and fills the matching structured payload.
// This lets the owner snap the front, the price tag, and the nutrition label of
// one product, upload them together, and have each routed automatically.
//
// Reuses the exact field definitions from the single-image scanners (composed,
// not duplicated) so extraction quality matches. Server-only.

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { PROPERTIES as PRODUCT_PROPERTIES, MissingApiKeyError } from "./claude";
import { PROPERTIES as NUTRITION_PROPERTIES } from "./nutrition-claude";
import { scannedProductSchema } from "./schemas";
import { scannedNutritionSchema } from "./nutrition-schemas";
import type { ScannedNutrition, ScannedProduct } from "./types";

const MODEL = process.env.PRODUCT_SCAN_MODEL || process.env.NUTRITION_MODEL || "claude-opus-4-8";

export const IMAGE_KINDS = [
  "nutrition_facts",
  "product_front",
  "price_label",
  "barcode",
  "receipt",
  "other",
] as const;
export type ImageKind = (typeof IMAGE_KINDS)[number];

const TOOL = {
  name: "record_scanned_image",
  description: "Classify the photo and record the structured data it contains.",
  input_schema: {
    type: "object" as const,
    properties: {
      imageKind: {
        type: "string",
        enum: IMAGE_KINDS,
        description:
          "What this photo primarily shows: 'nutrition_facts' for a Nutrition Facts panel; 'product_front' for a product package; 'price_label' for a Costco shelf/price tag; 'barcode'; 'receipt'; or 'other'.",
      },
      product: {
        type: ["object", "null"],
        description: "Product/price fields. Fill this when imageKind is NOT nutrition_facts; otherwise null.",
        properties: PRODUCT_PROPERTIES,
        required: Object.keys(PRODUCT_PROPERTIES),
        additionalProperties: false,
      },
      nutrition: {
        type: ["object", "null"],
        description: "Nutrition Facts fields. Fill this ONLY when imageKind is nutrition_facts; otherwise null.",
        properties: NUTRITION_PROPERTIES,
        required: Object.keys(NUTRITION_PROPERTIES),
        additionalProperties: false,
      },
    },
    required: ["imageKind", "product", "nutrition"],
    additionalProperties: false,
  },
};

const SYSTEM = [
  "You extract structured grocery data from a SINGLE photo that is one of: a product package front, a Costco shelf/price label, a price tag, a barcode, a receipt line, or a Nutrition Facts panel.",
  "",
  "First classify the photo via imageKind. Then:",
  "- If it is a Nutrition Facts panel, fill `nutrition` and set `product` to null.",
  "- Otherwise fill `product` and set `nutrition` to null.",
  "",
  "Product rules:",
  "- Report ONLY what you can read. Never invent a name, price, weight, barcode, or item number. Unreadable → null + add the field name to product.lowConfidenceFields.",
  "- Distinguish the full package price (totalPrice) from any per-unit price printed on the label. Read barcode digits, not the bars. Costco shelf labels show a 6–7 digit item number.",
  "- For weight items set totalWeight + weightUnit; for multipacks set packageCount. Pick one best-fit category.",
  "",
  "Nutrition rules:",
  "- Report ONLY printed values; unreadable → null + add to nutrition.lowConfidenceFields. Use per-serving values.",
  "- Keep units as printed: grams for fats/carbs/fiber/sugars/protein, mg for sodium/cholesterol/minerals, mcg for vitamin D. Capture the full serving description and the metric serving size.",
  "",
  "Call record_scanned_image exactly once.",
].join("\n");

const comboSchema = z.object({
  imageKind: z.preprocess(
    (v) => (IMAGE_KINDS.includes(v as ImageKind) ? v : "other"),
    z.enum(IMAGE_KINDS),
  ),
  product: scannedProductSchema.nullish(),
  nutrition: scannedNutritionSchema.nullish(),
});

export type ComboScan = {
  imageKind: ImageKind;
  product: ScannedProduct | null;
  nutrition: ScannedNutrition | null;
};

export { MissingApiKeyError };

export async function scanCombo(opts: {
  base64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
}): Promise<ComboScan> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new MissingApiKeyError(
      "ANTHROPIC_API_KEY is not configured on the server. Add it to .env.local (and your deployment env) to enable scanning.",
    );
  }
  const client = new Anthropic({ apiKey });

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 3072,
    system: SYSTEM,
    tools: [TOOL],
    tool_choice: { type: "tool", name: TOOL.name },
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: opts.mediaType, data: opts.base64 } },
          { type: "text", text: "Classify this photo and extract its data. Flag anything you are unsure about." },
        ],
      },
    ],
  });

  const block = resp.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("Claude did not return a structured result.");
  }
  const parsed = comboSchema.safeParse(block.input);
  if (!parsed.success) {
    throw new Error("Claude returned an unexpected shape: " + parsed.error.message);
  }

  // Trust imageKind to decide which payload applies (ignore the other).
  const kind = parsed.data.imageKind;
  return {
    imageKind: kind,
    product: kind === "nutrition_facts" ? null : (parsed.data.product ?? null),
    nutrition: kind === "nutrition_facts" ? (parsed.data.nutrition ?? null) : null,
  };
}
