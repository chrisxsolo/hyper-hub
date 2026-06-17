import { type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthContext, jsonError, jsonOk, requestId } from "@/lib/owner";
import { nutritionVersionSaveSchema } from "@/lib/products/nutrition-schemas";
import {
  loadNutritionVersions,
  loadOverviewRow,
  recordProductImage,
} from "@/lib/products/server";

const idSchema = z.string().uuid();

// GET — all nutrition versions for a product (current first), signed images.
export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in to view nutrition.", rid);

  const { id } = await ctx.params;
  if (!idSchema.safeParse(id).success) return jsonError(400, "Invalid product id.", rid);

  const versions = await loadNutritionVersions(supabase, id);
  return jsonOk({ versions }, rid);
}

// POST — save a confirmed nutrition version. Supersedes the prior current version
// (one current per product, enforced in a transaction by the RPC), records the
// label image, and links the product into the calorie-tracker food library.
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in to save nutrition.", rid);

  const { id } = await ctx.params;
  if (!idSchema.safeParse(id).success) return jsonError(400, "Invalid product id.", rid);

  let f: ReturnType<typeof nutritionVersionSaveSchema.parse>;
  try {
    f = nutritionVersionSaveSchema.parse(await request.json());
  } catch (e) {
    return jsonError(400, "Invalid nutrition payload.", rid, {
      details: e instanceof Error ? e.message : undefined,
    });
  }

  const { data: product } = await supabase
    .from("costco_products")
    .select("id,name,brand")
    .eq("id", id)
    .maybeSingle();
  if (!product) return jsonError(404, "Product not found.", rid);

  // Map the camelCase API to the snake_case keys the RPC reads from p_fields.
  const pFields: Record<string, unknown> = {
    serving_size_description: f.servingSizeDescription ?? null,
    serving_size_value: f.servingSizeValue ?? null,
    serving_size_unit: f.servingSizeUnit ?? null,
    servings_per_container: f.servingsPerContainer ?? null,
    calories: f.calories ?? null,
    total_fat_g: f.totalFatG ?? null,
    saturated_fat_g: f.saturatedFatG ?? null,
    trans_fat_g: f.transFatG ?? null,
    cholesterol_mg: f.cholesterolMg ?? null,
    sodium_mg: f.sodiumMg ?? null,
    total_carbohydrate_g: f.totalCarbohydrateG ?? null,
    dietary_fiber_g: f.dietaryFiberG ?? null,
    total_sugars_g: f.totalSugarsG ?? null,
    added_sugars_g: f.addedSugarsG ?? null,
    protein_g: f.proteinG ?? null,
    vitamin_d_mcg: f.vitaminDMcg ?? null,
    calcium_mg: f.calciumMg ?? null,
    iron_mg: f.ironMg ?? null,
    potassium_mg: f.potassiumMg ?? null,
    additional_nutrients: f.additionalNutrients ?? null,
    source_image_url: f.sourceImagePath ?? null,
    recognition_confidence: f.recognitionConfidence ?? null,
    notes: f.notes ?? null,
    is_user_confirmed: true,
    observed_at: f.observedAt ?? null,
  };

  const { data: versionId, error } = await supabase.rpc("costco_save_nutrition_version", {
    p_product_id: id,
    p_fields: pFields,
  });
  if (error) return jsonError(500, error.message, rid);

  // Record the label image (best-effort) + link into the food library.
  if (f.sourceImagePath) {
    await recordProductImage(supabase, id, "nutrition_label", f.sourceImagePath);
  }
  await supabase.from("food_library_items").upsert(
    {
      product_id: id,
      nutrition_version_id: versionId as string,
      display_name: (product as { name: string }).name,
      brand: (product as { brand: string | null }).brand,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "product_id" },
  );

  const [overview, versions] = await Promise.all([
    loadOverviewRow(supabase, id),
    loadNutritionVersions(supabase, id),
  ]);
  return jsonOk({ product: overview, versions, versionId }, rid, 201);
}
