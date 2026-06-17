import { type NextRequest } from "next/server";
import { createMealSchema } from "@/lib/nutrition/schemas";
import { buildCacheArgs } from "@/lib/nutrition/units";
import { getAuthContext, jsonError, jsonOk, requestId } from "@/lib/nutrition/server";

// Create a meal (idempotent on client_token). Totals are recomputed server-side
// by the nutrition_save_meal DB function; confirmed foods are cached for reuse.
export async function POST(request: NextRequest) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in as the owner to save meals.", rid);

  let body: ReturnType<typeof createMealSchema.parse>;
  try {
    body = createMealSchema.parse(await request.json());
  } catch (e) {
    return jsonError(400, "Invalid meal payload.", rid, {
      details: e instanceof Error ? e.message : undefined,
    });
  }

  const { data: mealId, error } = await supabase.rpc("nutrition_save_meal", {
    p_meal: body.meal,
    p_items: body.items,
  });
  if (error) return jsonError(500, error.message, rid);

  // Cache confirmed foods (best-effort; never blocks the save result).
  await Promise.allSettled(
    body.items.map((it) => {
      const args = buildCacheArgs({
        name: it.name,
        brand: it.brand ?? null,
        preparationState: it.preparation_state ?? null,
        calories: it.calories ?? null,
        proteinGrams: it.protein_g ?? null,
        grams: it.grams ?? null,
        quantity: it.quantity ?? null,
        unit: it.unit,
        sourceType: it.source_type,
        sourceName: it.source_name ?? null,
        sourceUrl: it.source_url ?? null,
        verified: it.verified,
      });
      return args ? supabase.rpc("nutrition_cache_food", args) : Promise.resolve();
    }),
  );

  return jsonOk({ id: mealId }, rid, 201);
}
