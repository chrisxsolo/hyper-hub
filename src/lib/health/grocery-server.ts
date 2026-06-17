// Server-only helper that enriches grocery rows that reference a Costco product
// with a compact preview (image, latest price, nutrition summary). The grocery
// item itself stores only a product_id — the canonical data lives on the product,
// so the list always shows the latest confirmed info (spec §7).

import type { SupabaseClient } from "@supabase/supabase-js";
import { signImagePaths } from "@/lib/products/server";
import type { ProductOverview } from "@/lib/products/types";
import type { DbGroceryItem, GroceryItemView, GroceryProductPreview } from "./grocery";

function packageSummary(p: ProductOverview): string | null {
  if (p.total_weight != null) return `${p.total_weight} ${p.weight_unit ?? "lb"}`;
  if (p.package_count != null) return `${p.package_count} ct`;
  if (p.package_size != null) return `${p.package_size} ${p.package_unit ?? ""}`.trim();
  return null;
}

export async function enrichGroceryItems(
  supabase: SupabaseClient,
  items: DbGroceryItem[],
): Promise<GroceryItemView[]> {
  const productIds = [...new Set(items.map((i) => i.product_id).filter((x): x is string => !!x))];
  if (!productIds.length) return items.map((i) => ({ ...i, product: null }));

  const { data } = await supabase
    .from("costco_products_overview")
    .select("*")
    .in("id", productIds);
  const rows = (data ?? []) as ProductOverview[];
  const signed = await signImagePaths(supabase, rows.map((r) => r.image_url));

  const byId = new Map<string, GroceryProductPreview>();
  for (const r of rows) {
    byId.set(r.id, {
      id: r.id,
      brand: r.brand,
      category: r.category,
      imageUrl: r.image_url ? signed.get(r.image_url) ?? null : null,
      last_total_price: r.last_total_price,
      last_unit_price: r.last_unit_price,
      last_unit_type: r.last_unit_type,
      package_summary: packageSummary(r),
      nutrition_version_id: r.nutrition_version_id,
      n_calories: r.n_calories,
      n_protein_g: r.n_protein_g,
      n_serving_desc: r.n_serving_desc,
      last_purchased_at: r.last_purchased_at,
    });
  }

  return items.map((i) => ({ ...i, product: i.product_id ? byId.get(i.product_id) ?? null : null }));
}
