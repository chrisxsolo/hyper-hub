import { type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthContext, jsonError, jsonOk, requestId } from "@/lib/nutrition/server";
import { MEAL_TYPES } from "@/lib/nutrition/types";
import { scaleNutrition } from "@/lib/products/serving";
import type { DbCostcoProductNutritionVersion } from "@/lib/products/types";

const bodySchema = z.object({
  productId: z.string().uuid(),
  versionId: z.string().uuid().nullable().optional(),
  amount: z.number().positive().max(100_000),
  unit: z.string().trim().min(1).max(20),
  mealType: z.enum(MEAL_TYPES).default("snack"),
  eatenOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  consumedAt: z.string().max(40).nullable().optional(),
});

// POST — log a Costco product into the calorie tracker as a one-item meal.
// The server re-loads the nutrition version and recomputes the snapshot itself
// (never trusts client numbers), freezing every nutrient at log time so future
// reformulations can't change historical days (spec §16).
export async function POST(request: NextRequest) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in as the owner to log foods.", rid);

  let body: ReturnType<typeof bodySchema.parse>;
  try {
    body = bodySchema.parse(await request.json());
  } catch (e) {
    return jsonError(400, "Invalid log payload.", rid, {
      details: e instanceof Error ? e.message : undefined,
    });
  }

  // Load the requested version, or the product's current one.
  let q = supabase
    .from("costco_product_nutrition_versions")
    .select("*")
    .eq("product_id", body.productId);
  q = body.versionId ? q.eq("id", body.versionId) : q.eq("is_current", true);
  const { data: version } = await q.maybeSingle();
  if (!version) return jsonError(404, "No confirmed nutrition for that product.", rid);
  const v = version as DbCostcoProductNutritionVersion;

  const scaled = scaleNutrition(v, body.amount, body.unit);
  if (!scaled.ok) return jsonError(422, scaled.reason, rid);
  const s = scaled.snapshot;

  const { data: product } = await supabase
    .from("costco_products")
    .select("name,brand")
    .eq("id", body.productId)
    .maybeSingle();
  const name = (product as { name?: string } | null)?.name ?? "Costco product";
  const brand = (product as { brand?: string | null } | null)?.brand ?? null;

  const item = {
    position: 0,
    original_phrase: `${body.amount} ${body.unit} — ${name}`,
    name,
    brand,
    quantity: body.amount,
    unit: body.unit,
    calories: s.calories,
    protein_g: s.proteinG,
    grams: s.grams,
    nutrition_basis: "per_serving",
    source_type: "personal",
    source_name: "Costco product (your verified nutrition)",
    confidence: 1,
    verified: true,
    product_id: body.productId,
    nutrition_version_id: v.id,
    total_fat_g: s.totalFatG,
    saturated_fat_g: s.saturatedFatG,
    trans_fat_g: s.transFatG,
    cholesterol_mg: s.cholesterolMg,
    sodium_mg: s.sodiumMg,
    total_carbohydrate_g: s.totalCarbohydrateG,
    dietary_fiber_g: s.dietaryFiberG,
    total_sugars_g: s.totalSugarsG,
    added_sugars_g: s.addedSugarsG,
  };

  const meal = {
    meal_type: body.mealType,
    consumed_at: body.consumedAt ?? null,
    eaten_on: body.eatenOn,
    original_text: name,
    confidence: 1,
    assumptions: [],
    client_token: globalThis.crypto.randomUUID(),
  };

  const { data: mealId, error } = await supabase.rpc("nutrition_save_meal", {
    p_meal: meal,
    p_items: [item],
  });
  if (error) return jsonError(500, error.message, rid);

  return jsonOk({ id: mealId, snapshot: s }, rid, 201);
}
