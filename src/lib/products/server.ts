// Server-only helpers for the products API: a best-effort rate limiter, private
// image storage (upload + short-lived signed URLs), and existing-product
// matching. Auth + JSON helpers are reused from lib/owner.ts. Never logs secrets.

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DbCostcoProduct,
  DbCostcoProductImage,
  DbCostcoProductNutritionVersion,
  DbCostcoProductPrice,
  NutritionVersionEntry,
  PriceHistoryEntry,
  ProductImageEntry,
  ProductImageType,
  ProductOverview,
} from "./types";

type OverviewRow = Omit<ProductOverview, "imageUrl">;

export const PRODUCT_BUCKET = "costco-products";

// In-memory token bucket — best-effort throttle for the expensive scan route.
// Resets on cold start; acceptable for a single-owner personal tool.
const buckets = new Map<string, { tokens: number; resetAt: number }>();
export function rateLimit(key: string, max = 15, windowMs = 60_000): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { tokens: max - 1, resetAt: now + windowMs });
    return true;
  }
  if (b.tokens <= 0) return false;
  b.tokens -= 1;
  return true;
}

function extFor(mediaType: string): string {
  if (mediaType === "image/png") return "png";
  if (mediaType === "image/webp") return "webp";
  return "jpg";
}

// Upload a base64 scan image to the private bucket; returns the object path.
// `folder` keeps scan kinds tidy (scans/ for product+price, nutrition/ for
// labels, images/ for product photos).
export async function uploadScanImage(
  supabase: SupabaseClient,
  base64: string,
  mediaType: string,
  folder = "scans",
): Promise<string> {
  const id = globalThis.crypto.randomUUID();
  const path = `${folder}/${id}.${extFor(mediaType)}`;
  const bytes = Buffer.from(base64, "base64");
  const { error } = await supabase.storage
    .from(PRODUCT_BUCKET)
    .upload(path, bytes, { contentType: mediaType, upsert: false });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  return path;
}

// Best-effort delete (e.g. when a product is removed). Swallows errors.
export async function deleteImages(supabase: SupabaseClient, paths: (string | null | undefined)[]) {
  const real = paths.filter((p): p is string => !!p);
  if (!real.length) return;
  try {
    await supabase.storage.from(PRODUCT_BUCKET).remove(real);
  } catch {
    /* non-fatal */
  }
}

// Batch-sign a set of object paths into display-ready URLs (default 1h expiry).
export async function signImagePaths(
  supabase: SupabaseClient,
  paths: (string | null | undefined)[],
  expiresIn = 3600,
): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => !!p))];
  const map = new Map<string, string>();
  if (!unique.length) return map;
  const { data } = await supabase.storage.from(PRODUCT_BUCKET).createSignedUrls(unique, expiresIn);
  for (const row of data ?? []) {
    if (row.path && row.signedUrl) map.set(row.path, row.signedUrl);
  }
  return map;
}

export async function signImagePath(
  supabase: SupabaseClient,
  path: string | null | undefined,
  expiresIn = 3600,
): Promise<string | null> {
  if (!path) return null;
  const m = await signImagePaths(supabase, [path], expiresIn);
  return m.get(path) ?? null;
}

// Load every product from the overview view (favorites first, then by name),
// with all image paths batch-signed into display URLs.
export async function loadAllOverview(supabase: SupabaseClient): Promise<ProductOverview[]> {
  const { data } = await supabase
    .from("costco_products_overview")
    .select("*")
    .order("is_favorite", { ascending: false })
    .order("name", { ascending: true });
  const rows = (data ?? []) as OverviewRow[];
  const signed = await signImagePaths(supabase, rows.map((r) => r.image_url));
  return rows.map((r) => ({ ...r, imageUrl: r.image_url ? signed.get(r.image_url) ?? null : null }));
}

// Load a single overview row (used after create/update/price-append).
export async function loadOverviewRow(
  supabase: SupabaseClient,
  id: string,
): Promise<ProductOverview | null> {
  const { data } = await supabase
    .from("costco_products_overview")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const r = data as OverviewRow;
  return { ...r, imageUrl: await signImagePath(supabase, r.image_url) };
}

// All images for a product, newest/primary first, with signed display URLs.
export async function loadProductImages(
  supabase: SupabaseClient,
  productId: string,
): Promise<ProductImageEntry[]> {
  const { data } = await supabase
    .from("costco_product_images")
    .select("*")
    .eq("product_id", productId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as DbCostcoProductImage[];
  const signed = await signImagePaths(supabase, rows.map((r) => r.image_url));
  return rows.map((r) => ({ ...r, signedUrl: signed.get(r.image_url) ?? null }));
}

// Record an image row for a product (the scan routes call this after upload).
export async function recordProductImage(
  supabase: SupabaseClient,
  productId: string,
  imageType: ProductImageType,
  path: string,
  isPrimary = false,
): Promise<void> {
  await supabase.from("costco_product_images").insert({
    product_id: productId,
    image_type: imageType,
    image_url: path,
    is_primary: isPrimary,
  });
}

// Full price history for a product (newest first), with signed source images.
export async function loadPriceHistory(
  supabase: SupabaseClient,
  productId: string,
): Promise<PriceHistoryEntry[]> {
  const { data } = await supabase
    .from("costco_product_prices")
    .select("*")
    .eq("product_id", productId)
    .order("observed_at", { ascending: false })
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as DbCostcoProductPrice[];
  const signed = await signImagePaths(supabase, rows.map((p) => p.source_image_url));
  return rows.map((p) => ({
    ...p,
    sourceImageUrl: p.source_image_url ? signed.get(p.source_image_url) ?? null : null,
  }));
}

// All nutrition versions for a product (current first, then newest), with the
// source-label image signed for display.
export async function loadNutritionVersions(
  supabase: SupabaseClient,
  productId: string,
): Promise<NutritionVersionEntry[]> {
  const { data } = await supabase
    .from("costco_product_nutrition_versions")
    .select("*")
    .eq("product_id", productId)
    .order("is_current", { ascending: false })
    .order("observed_at", { ascending: false });
  const rows = (data ?? []) as DbCostcoProductNutritionVersion[];
  const signed = await signImagePaths(supabase, rows.map((r) => r.source_image_url));
  return rows.map((r) => ({
    ...r,
    sourceImageUrl: r.source_image_url ? signed.get(r.source_image_url) ?? null : null,
  }));
}

// Match a scan against the existing database, in the spec's priority order:
// 1) exact barcode, 2) exact Costco item number, 3) name contains/contained.
export async function findExistingProduct(
  supabase: SupabaseClient,
  scan: { barcode: string | null; costcoItemNumber: string | null; name: string | null },
): Promise<{ product: DbCostcoProduct; reason: string } | null> {
  if (scan.barcode) {
    const { data } = await supabase
      .from("costco_products")
      .select("*")
      .eq("barcode", scan.barcode)
      .limit(1)
      .maybeSingle();
    if (data) return { product: data as DbCostcoProduct, reason: "barcode" };
  }
  if (scan.costcoItemNumber) {
    const { data } = await supabase
      .from("costco_products")
      .select("*")
      .eq("costco_item_number", scan.costcoItemNumber)
      .limit(1)
      .maybeSingle();
    if (data) return { product: data as DbCostcoProduct, reason: "Costco item number" };
  }
  const term = scan.name?.trim() ?? "";
  if (term.length >= 4) {
    // Escape PostgREST ilike wildcards in the user-derived term.
    const safe = term.replace(/[%_,()]/g, " ").trim();
    if (safe) {
      const { data } = await supabase
        .from("costco_products")
        .select("*")
        .ilike("name", `%${safe}%`)
        .limit(1)
        .maybeSingle();
      if (data) return { product: data as DbCostcoProduct, reason: "name" };
    }
  }
  return null;
}
