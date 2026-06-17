import { type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthContext, jsonError, jsonOk, requestId } from "@/lib/owner";
import { productUpdateSchema } from "@/lib/products/schemas";
import {
  deleteImages,
  loadNutritionVersions,
  loadOverviewRow,
  loadProductImages,
  signImagePaths,
} from "@/lib/products/server";
import type { DbCostcoProduct, DbCostcoProductPrice, PriceHistoryEntry } from "@/lib/products/types";

const idSchema = z.string().uuid();

// GET — a product plus its full price history (with signed source images).
export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in to view products.", rid);

  const { id } = await ctx.params;
  if (!idSchema.safeParse(id).success) return jsonError(400, "Invalid product id.", rid);

  const product = await loadOverviewRow(supabase, id);
  if (!product) return jsonError(404, "Product not found.", rid);

  const { data: priceRows } = await supabase
    .from("costco_product_prices")
    .select("*")
    .eq("product_id", id)
    .order("observed_at", { ascending: false })
    .order("created_at", { ascending: false });
  const prices = (priceRows ?? []) as DbCostcoProductPrice[];
  const signed = await signImagePaths(supabase, prices.map((p) => p.source_image_url));
  const history: PriceHistoryEntry[] = prices.map((p) => ({
    ...p,
    sourceImageUrl: p.source_image_url ? signed.get(p.source_image_url) ?? null : null,
  }));

  const [images, nutritionVersions] = await Promise.all([
    loadProductImages(supabase, id),
    loadNutritionVersions(supabase, id),
  ]);

  return jsonOk({ product, history, images, nutritionVersions }, rid);
}

// PATCH — edit product attributes (favorite, name, category, notes, …).
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in to edit products.", rid);

  const { id } = await ctx.params;
  if (!idSchema.safeParse(id).success) return jsonError(400, "Invalid product id.", rid);

  let body: ReturnType<typeof productUpdateSchema.parse>;
  try {
    body = productUpdateSchema.parse(await request.json());
  } catch (e) {
    return jsonError(400, "Invalid update payload.", rid, {
      details: e instanceof Error ? e.message : undefined,
    });
  }

  // Map the camelCase API to snake_case columns; only set provided keys.
  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.brand !== undefined) patch.brand = body.brand;
  if (body.variant !== undefined) patch.variant = body.variant;
  if (body.category !== undefined) patch.category = body.category;
  if (body.barcode !== undefined) patch.barcode = body.barcode;
  if (body.costcoItemNumber !== undefined) patch.costco_item_number = body.costcoItemNumber;
  if (body.preferredQuantity !== undefined) patch.preferred_quantity = body.preferredQuantity;
  if (body.notes !== undefined) patch.notes = body.notes;
  if (body.isFavorite !== undefined) patch.is_favorite = body.isFavorite;

  const { error } = await supabase.from("costco_products").update(patch).eq("id", id);
  if (error) return jsonError(500, error.message, rid);

  const overview = await loadOverviewRow(supabase, id);
  if (!overview) return jsonError(404, "Product not found.", rid);
  return jsonOk({ product: overview }, rid);
}

// DELETE — remove a product (prices cascade) and its stored images.
export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in to delete products.", rid);

  const { id } = await ctx.params;
  if (!idSchema.safeParse(id).success) return jsonError(400, "Invalid product id.", rid);

  // Collect image paths before the cascade removes the price rows.
  const { data: prod } = await supabase
    .from("costco_products")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();
  const { data: priceImgs } = await supabase
    .from("costco_product_prices")
    .select("source_image_url")
    .eq("product_id", id);

  const { error } = await supabase.from("costco_products").delete().eq("id", id);
  if (error) return jsonError(500, error.message, rid);

  await deleteImages(supabase, [
    (prod as Pick<DbCostcoProduct, "image_url"> | null)?.image_url,
    ...((priceImgs as { source_image_url: string | null }[] | null)?.map((r) => r.source_image_url) ?? []),
  ]);

  return jsonOk({ id, deleted: true }, rid);
}
