import { getAuthContext, jsonError, jsonOk, requestId } from "@/lib/nutrition/server";
import { signImagePaths } from "@/lib/products/server";
import type {
  DbCostcoProductNutritionVersion,
  FoodLibraryEntry,
  ProductOverview,
} from "@/lib/products/types";

// GET — products that have confirmed current nutrition, for the calorie
// tracker's "Costco Products" food library (spec §9). Each entry carries the
// full current nutrition version so the serving-entry sheet can preview scaled
// values without another round-trip.
export async function GET() {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in to view your food library.", rid);

  // Products with a current nutrition version (drives the list even if a
  // food_library_items row is missing).
  const { data: ovRows } = await supabase
    .from("costco_products_overview")
    .select("*")
    .not("nutrition_version_id", "is", null)
    .order("name", { ascending: true });
  const products = (ovRows ?? []) as ProductOverview[];
  if (!products.length) return jsonOk({ items: [] }, rid);

  const ids = products.map((p) => p.id);
  const [{ data: verRows }, { data: favRows }, signed] = await Promise.all([
    supabase
      .from("costco_product_nutrition_versions")
      .select("*")
      .in("product_id", ids)
      .eq("is_current", true),
    supabase.from("food_library_items").select("product_id,is_favorite").in("product_id", ids),
    signImagePaths(supabase, products.map((p) => p.image_url)),
  ]);

  const versionByProduct = new Map<string, DbCostcoProductNutritionVersion>();
  for (const v of (verRows ?? []) as DbCostcoProductNutritionVersion[]) {
    versionByProduct.set(v.product_id, v);
  }
  const favByProduct = new Map<string, boolean>();
  for (const r of (favRows ?? []) as { product_id: string; is_favorite: boolean }[]) {
    favByProduct.set(r.product_id, r.is_favorite);
  }

  const items: FoodLibraryEntry[] = products
    .map((p) => {
      const nutrition = versionByProduct.get(p.id);
      if (!nutrition) return null;
      return {
        productId: p.id,
        name: p.name,
        brand: p.brand,
        variant: p.variant,
        category: p.category,
        imageUrl: p.image_url ? signed.get(p.image_url) ?? null : null,
        isFavorite: favByProduct.get(p.id) ?? false,
        lastTotalPrice: p.last_total_price,
        packageCount: p.package_count,
        totalWeight: p.total_weight,
        weightUnit: p.weight_unit,
        nutrition,
      } satisfies FoodLibraryEntry;
    })
    .filter((x): x is FoodLibraryEntry => x !== null);

  return jsonOk({ items }, rid);
}
