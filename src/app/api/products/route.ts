import { type NextRequest } from "next/server";
import { getAuthContext, jsonError, jsonOk, requestId } from "@/lib/owner";
import { productCreateSchema } from "@/lib/products/schemas";
import { loadAllOverview, loadOverviewRow, recordProductImage } from "@/lib/products/server";

// The product database is private (owner-only RLS).

// GET — list all products (favorites first), each with its latest price and a
// signed image URL.
export async function GET() {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in to view your products.", rid);
  try {
    const products = await loadAllOverview(supabase);
    return jsonOk({ products }, rid);
  } catch (e) {
    return jsonError(500, e instanceof Error ? e.message : "Couldn't load products.", rid);
  }
}

// POST — create a confirmed product and its first price observation.
export async function POST(request: NextRequest) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in to save products.", rid);

  let body: ReturnType<typeof productCreateSchema.parse>;
  try {
    body = productCreateSchema.parse(await request.json());
  } catch (e) {
    return jsonError(400, "Invalid product payload.", rid, {
      details: e instanceof Error ? e.message : undefined,
    });
  }

  const { data: product, error: pErr } = await supabase
    .from("costco_products")
    .insert({
      name: body.name,
      brand: body.brand ?? null,
      variant: body.variant ?? null,
      category: body.category ?? null,
      barcode: body.barcode ?? null,
      costco_item_number: body.costcoItemNumber ?? null,
      package_count: body.packageCount ?? null,
      package_size: body.packageSize ?? null,
      package_unit: body.packageUnit ?? null,
      total_weight: body.totalWeight ?? null,
      weight_unit: body.weightUnit ?? null,
      total_volume: body.totalVolume ?? null,
      volume_unit: body.volumeUnit ?? null,
      standard_unit: body.standardUnit ?? null,
      notes: body.notes ?? null,
      image_url: body.imagePath ?? null,
    })
    .select("id")
    .single();
  if (pErr || !product) return jsonError(500, pErr?.message ?? "Couldn't create product.", rid);

  // Price is optional: the in-tracker scan-to-log flow records a food without one.
  const p = body.price;
  if (p) {
    const { error: prErr } = await supabase.from("costco_product_prices").insert({
      product_id: product.id,
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
    if (prErr) {
      // Roll back the orphaned product so we don't leave a half-created record.
      await supabase.from("costco_products").delete().eq("id", product.id);
      return jsonError(500, prErr.message, rid);
    }
  }

  // Record the scan as a typed product image (best-effort) so the detail page's
  // Photos & Scans section is populated. source_type tells us what it depicts.
  if (body.imagePath) {
    const kind = p?.sourceType === "shelf_label" ? "price_label" : "product_front";
    await recordProductImage(supabase, product.id, kind, body.imagePath, kind === "product_front");
  }

  const overview = await loadOverviewRow(supabase, product.id);
  return jsonOk({ product: overview }, rid, 201);
}
