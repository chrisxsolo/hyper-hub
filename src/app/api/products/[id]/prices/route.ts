import { type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthContext, jsonError, jsonOk, requestId } from "@/lib/owner";
import { priceAppendSchema } from "@/lib/products/schemas";
import { loadOverviewRow, recordProductImage } from "@/lib/products/server";

const idSchema = z.string().uuid();

// POST — append a new price observation to an existing product (e.g. re-scanning
// a product you already track). Returns the refreshed overview row.
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in to record prices.", rid);

  const { id } = await ctx.params;
  if (!idSchema.safeParse(id).success) return jsonError(400, "Invalid product id.", rid);

  let p: ReturnType<typeof priceAppendSchema.parse>;
  try {
    p = priceAppendSchema.parse(await request.json());
  } catch (e) {
    return jsonError(400, "Invalid price payload.", rid, {
      details: e instanceof Error ? e.message : undefined,
    });
  }

  // Make sure the product exists (and is visible under RLS) before inserting.
  const { data: exists } = await supabase
    .from("costco_products")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!exists) return jsonError(404, "Product not found.", rid);

  const { error } = await supabase.from("costco_product_prices").insert({
    product_id: id,
    total_price: p.totalPrice,
    currency: p.currency,
    unit_price: p.unitPrice ?? null,
    unit_type: p.unitType ?? null,
    package_count: p.packageCount ?? null,
    package_size: p.packageSize ?? null,
    package_unit: p.packageUnit ?? null,
    store_name: p.storeName ?? null,
    store_location: p.storeLocation ?? null,
    source_type: p.sourceType,
    source_image_url: p.sourceImagePath ?? null,
    recognition_confidence: p.recognitionConfidence ?? null,
    is_user_confirmed: true,
    observed_at: p.observedAt ?? new Date().toISOString(),
  });
  if (error) return jsonError(500, error.message, rid);

  // Record the price scan as a typed image (best-effort).
  if (p.sourceImagePath) {
    await recordProductImage(supabase, id, "price_label", p.sourceImagePath);
  }

  const overview = await loadOverviewRow(supabase, id);
  return jsonOk({ product: overview }, rid, 201);
}
