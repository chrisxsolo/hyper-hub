import { type NextRequest } from "next/server";
import { getAuthContext, jsonError, jsonOk, requestId } from "@/lib/owner";
import { scanRequestSchema } from "@/lib/products/schemas";
import { scanCombo, MissingApiKeyError, type ComboScan } from "@/lib/products/combo-claude";
import { computeUnitPricing } from "@/lib/products/units";
import { rateLimit, uploadScanImage, signImagePath, findExistingProduct } from "@/lib/products/server";

// Vision call can take a while; allow more than the default budget.
export const maxDuration = 60;

// POST — scan ONE photo for the multi-photo flow: store it, classify it
// (nutrition vs product/price/barcode/receipt), and extract the matching data.
// The client calls this once per selected photo, then merges the results into a
// single product. The image is persisted even if recognition fails.
export async function POST(request: NextRequest) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in as the owner to scan.", rid);
  if (!rateLimit("scan-combo", 60, 60_000)) {
    return jsonError(429, "Too many scans in a short window — wait a moment and retry.", rid);
  }

  let body: ReturnType<typeof scanRequestSchema.parse>;
  try {
    body = scanRequestSchema.parse(await request.json());
  } catch {
    return jsonError(400, "Invalid scan request.", rid);
  }

  let imagePath: string;
  try {
    imagePath = await uploadScanImage(supabase, body.imageBase64, body.mediaType, "scans");
  } catch (e) {
    return jsonError(502, e instanceof Error ? e.message : "Image upload failed.", rid);
  }

  let combo: ComboScan | null = null;
  let warning: string | null = null;
  try {
    combo = await scanCombo({ base64: body.imageBase64, mediaType: body.mediaType });
  } catch (e) {
    if (e instanceof MissingApiKeyError) return jsonError(503, e.message, rid);
    warning = e instanceof Error ? e.message : "Recognition failed — enter the details manually.";
  }

  const imageUrl = await signImagePath(supabase, imagePath);

  let product: {
    scan: NonNullable<ComboScan["product"]>;
    pricing: ReturnType<typeof computeUnitPricing>;
    match: { id: string; name: string; reason: string } | null;
  } | null = null;

  if (combo?.product) {
    const sc = combo.product;
    const pricing = computeUnitPricing({
      totalPrice: sc.totalPrice,
      totalWeight: sc.totalWeight,
      weightUnit: sc.weightUnit,
      packageCount: sc.packageCount,
      pricePerLb: sc.pricePerLb,
      pricePerOz: sc.pricePerOz,
      pricePerItem: sc.pricePerItem,
    });
    const match = await findExistingProduct(supabase, {
      barcode: sc.barcode,
      costcoItemNumber: sc.costcoItemNumber,
      name: sc.name,
    });
    product = {
      scan: sc,
      pricing,
      match: match ? { id: match.product.id, name: match.product.name, reason: match.reason } : null,
    };
  }

  return jsonOk(
    {
      imageKind: combo?.imageKind ?? "other",
      imagePath,
      imageUrl,
      product,
      nutrition: combo?.nutrition ?? null,
      warning,
    },
    rid,
  );
}
