import { type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthContext, jsonError, jsonOk, requestId } from "@/lib/owner";
import { nutritionScanRequestSchema } from "@/lib/products/nutrition-schemas";
import { scanNutrition } from "@/lib/products/nutrition-claude";
import { MissingApiKeyError } from "@/lib/products/claude";
import { rateLimit, uploadScanImage, signImagePath } from "@/lib/products/server";
import type { ScannedNutrition } from "@/lib/products/types";

const idSchema = z.string().uuid();

// Vision call can take a while; allow more than the default budget.
export const maxDuration = 60;

// POST — scan a nutrition-facts label for a product: store the image, run
// recognition, and return everything the review screen needs. The image is
// persisted even if recognition fails, so the owner can still fill fields by hand.
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in as the owner to scan nutrition labels.", rid);

  const { id } = await ctx.params;
  if (!idSchema.safeParse(id).success) return jsonError(400, "Invalid product id.", rid);
  if (!rateLimit("nutrition-scan", 60, 60_000)) {
    return jsonError(429, "Too many scans in a short window — wait a moment and retry.", rid);
  }

  let body: ReturnType<typeof nutritionScanRequestSchema.parse>;
  try {
    body = nutritionScanRequestSchema.parse(await request.json());
  } catch {
    return jsonError(400, "Invalid scan request.", rid);
  }

  // Make sure the product exists (and is visible under RLS) before uploading.
  const { data: exists } = await supabase
    .from("costco_products")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!exists) return jsonError(404, "Product not found.", rid);

  let imagePath: string;
  try {
    imagePath = await uploadScanImage(supabase, body.imageBase64, body.mediaType, "nutrition");
  } catch (e) {
    return jsonError(502, e instanceof Error ? e.message : "Image upload failed.", rid);
  }

  let scan: ScannedNutrition | null = null;
  let warning: string | null = null;
  try {
    scan = await scanNutrition({ base64: body.imageBase64, mediaType: body.mediaType });
  } catch (e) {
    if (e instanceof MissingApiKeyError) return jsonError(503, e.message, rid);
    warning = e instanceof Error ? e.message : "Recognition failed — enter the values manually.";
  }

  const imageUrl = await signImagePath(supabase, imagePath);
  return jsonOk({ scan, imagePath, imageUrl, warning }, rid);
}
