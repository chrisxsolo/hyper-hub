import { type NextRequest } from "next/server";
import { getAuthContext, jsonError, jsonOk, requestId } from "@/lib/owner";
import { scanRequestSchema } from "@/lib/products/schemas";
import { scanProduct, MissingApiKeyError } from "@/lib/products/claude";
import { computeUnitPricing } from "@/lib/products/units";
import {
  rateLimit,
  uploadScanImage,
  signImagePath,
  findExistingProduct,
} from "@/lib/products/server";
import type { ScannedProduct } from "@/lib/products/types";

// Vision call can take a while; allow more than the default budget.
export const maxDuration = 60;

// POST — scan a product/price image: store it, run recognition, compute unit
// pricing, and look for an existing match. Returns everything the review screen
// needs. The image is persisted even if recognition fails, so the owner can
// still fill the fields in by hand.
export async function POST(request: NextRequest) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in as the owner to scan products.", rid);
  // Generous limit so batch uploads (many images in a burst) aren't throttled.
  if (!rateLimit("scan", 60, 60_000)) {
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
    imagePath = await uploadScanImage(supabase, body.imageBase64, body.mediaType);
  } catch (e) {
    return jsonError(502, e instanceof Error ? e.message : "Image upload failed.", rid);
  }

  let scan: ScannedProduct | null = null;
  let warning: string | null = null;
  try {
    scan = await scanProduct({ base64: body.imageBase64, mediaType: body.mediaType });
  } catch (e) {
    if (e instanceof MissingApiKeyError) return jsonError(503, e.message, rid);
    warning = e instanceof Error ? e.message : "Recognition failed — enter the details manually.";
  }

  const pricing = computeUnitPricing(
    scan
      ? {
          totalPrice: scan.totalPrice,
          totalWeight: scan.totalWeight,
          weightUnit: scan.weightUnit,
          packageCount: scan.packageCount,
          pricePerLb: scan.pricePerLb,
          pricePerOz: scan.pricePerOz,
          pricePerItem: scan.pricePerItem,
        }
      : { totalPrice: null },
  );

  const match = scan
    ? await findExistingProduct(supabase, {
        barcode: scan.barcode,
        costcoItemNumber: scan.costcoItemNumber,
        name: scan.name,
      })
    : null;

  const imageUrl = await signImagePath(supabase, imagePath);

  return jsonOk(
    {
      scan,
      pricing,
      imagePath,
      imageUrl,
      match: match ? { id: match.product.id, name: match.product.name, reason: match.reason } : null,
      warning,
    },
    rid,
  );
}
