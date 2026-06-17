import { type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthContext, jsonError, jsonOk, requestId } from "@/lib/owner";
import { NUTRITION_IMAGE_TYPES } from "@/lib/products/types";
import {
  loadProductImages,
  recordProductImage,
  uploadScanImage,
} from "@/lib/products/server";

const idSchema = z.string().uuid();

const bodySchema = z.object({
  imageBase64: z.string().min(1).max(20_000_000),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  imageType: z.enum(NUTRITION_IMAGE_TYPES).default("other"),
  isPrimary: z.boolean().default(false),
});

// GET — all stored images for a product, signed.
export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in to view images.", rid);
  const { id } = await ctx.params;
  if (!idSchema.safeParse(id).success) return jsonError(400, "Invalid product id.", rid);
  const images = await loadProductImages(supabase, id);
  return jsonOk({ images }, rid);
}

// POST — upload and attach a typed image (product photo, label, …) to a product.
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in to add images.", rid);

  const { id } = await ctx.params;
  if (!idSchema.safeParse(id).success) return jsonError(400, "Invalid product id.", rid);

  let body: ReturnType<typeof bodySchema.parse>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return jsonError(400, "Invalid image payload.", rid);
  }

  const { data: exists } = await supabase
    .from("costco_products")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!exists) return jsonError(404, "Product not found.", rid);

  let path: string;
  try {
    path = await uploadScanImage(supabase, body.imageBase64, body.mediaType, "images");
  } catch (e) {
    return jsonError(502, e instanceof Error ? e.message : "Image upload failed.", rid);
  }
  await recordProductImage(supabase, id, body.imageType, path, body.isPrimary);

  const images = await loadProductImages(supabase, id);
  return jsonOk({ images }, rid, 201);
}
