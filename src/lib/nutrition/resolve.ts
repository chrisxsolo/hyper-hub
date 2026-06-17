// Layered nutrition resolution. For every parsed item we walk the source
// hierarchy in priority order and take the first authoritative answer:
//
//   1. Personal cache  (foods the user has already confirmed)   → sourceType "personal"
//   2. USDA FoodData Central (generic foods, scaled by grams)    → sourceType "usda"
//   3. Claude's own labeled estimate / restaurant figures        → unchanged
//
// Numbers are always recomputed mathematically from a per-100g or per-unit
// anchor, never re-guessed.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClaudeItem, ClaudeMeal, ProposedItem, ProposedMeal } from "./types";
import { effectiveQuantity, foodMatchKey, round } from "./units";
import { usdaLookup } from "./usda";

type FoodRow = {
  match_key: string;
  name: string;
  brand: string | null;
  preparation_state: string | null;
  basis: string;
  calories_per_100g: number | null;
  protein_per_100g: number | null;
  serving_calories: number | null;
  serving_protein_g: number | null;
  serving_grams: number | null;
  source_type: string;
  source_name: string | null;
  source_url: string | null;
  verified: boolean;
};

function perUnit(total: number | null, qty: number | null): number | null {
  if (total == null || qty == null || qty === 0) return null;
  return total / qty;
}

async function resolveItem(
  item: ClaudeItem,
  supabase: SupabaseClient,
  foodsByKey: Map<string, FoodRow>,
): Promise<ProposedItem> {
  const qty = effectiveQuantity(item.quantity, item.quantityMin, item.quantityMax);
  const grams = item.gramsEstimate;

  // Start from Claude's interpretation + provisional estimate.
  let calories = item.calories;
  let protein = item.proteinGrams;
  let caloriesPer100g: number | null = null;
  let proteinPer100g: number | null = null;
  let sourceType = item.sourceType;
  let sourceName = item.sourceName;
  let sourceUrl = item.sourceUrl;
  let sourceRetrievedAt: string | null = null;
  let confidence = item.confidence;
  const assumptions = [...item.assumptions];

  // ── 1. Personal cache ────────────────────────────────────────────────────
  const key = foodMatchKey(item.normalizedName, item.preparationState, item.brand);
  const cached = foodsByKey.get(key);
  if (cached) {
    if (cached.basis === "per_100g" && cached.calories_per_100g != null && grams != null) {
      caloriesPer100g = Number(cached.calories_per_100g);
      proteinPer100g = cached.protein_per_100g != null ? Number(cached.protein_per_100g) : null;
      calories = round((caloriesPer100g * grams) / 100, 0);
      protein = proteinPer100g != null ? round((proteinPer100g * grams) / 100, 1) : protein;
    } else if (cached.serving_calories != null && qty != null) {
      calories = round(Number(cached.serving_calories) * qty, 0);
      protein = cached.serving_protein_g != null ? round(Number(cached.serving_protein_g) * qty, 1) : protein;
    } else if (cached.serving_calories != null) {
      calories = round(Number(cached.serving_calories), 0);
      protein = cached.serving_protein_g != null ? round(Number(cached.serving_protein_g), 1) : protein;
    }
    sourceType = "personal";
    sourceName = cached.source_name ?? "Your verified food";
    sourceUrl = cached.source_url;
    confidence = Math.max(confidence, cached.verified ? 0.95 : 0.85);
    assumptions.push("Matched a food you've confirmed before.");
  } else if (!item.isRestaurant && item.usdaQuery) {
    // ── 2. USDA FoodData Central (generic foods only) ──────────────────────
    const usda = await usdaLookup(item.usdaQuery);
    if (usda && usda.caloriesPer100g != null && grams != null) {
      caloriesPer100g = usda.caloriesPer100g;
      proteinPer100g = usda.proteinPer100g;
      calories = round((usda.caloriesPer100g * grams) / 100, 0);
      protein = usda.proteinPer100g != null ? round((usda.proteinPer100g * grams) / 100, 1) : protein;
      sourceType = "usda";
      sourceName = `USDA · ${usda.description}`;
      sourceUrl = usda.sourceUrl;
      sourceRetrievedAt = new Date().toISOString();
      confidence = Math.max(confidence, 0.8);
    }
  }
  // ── 3. else: Claude's labeled estimate / restaurant figures stand ────────

  return {
    originalPhrase: item.originalPhrase,
    name: item.normalizedName,
    brand: item.brand,
    quantity: item.quantity,
    quantityMin: item.quantityMin,
    quantityMax: item.quantityMax,
    unit: item.unit,
    preparationState: item.preparationState,
    gramsEstimate: grams,
    caloriesPer100g,
    proteinPer100g,
    calories,
    proteinGrams: protein,
    perUnitCalories: perUnit(calories, qty),
    perUnitProtein: perUnit(protein, qty),
    nutritionBasis: caloriesPer100g != null ? "per_100g" : item.nutritionBasis,
    sourceType,
    sourceName,
    sourceUrl,
    sourceRetrievedAt,
    confidence,
    assumptions,
    requiresConfirmation: item.requiresConfirmation,
    verified: false,
  };
}

export async function resolveMeal(
  meal: ClaudeMeal,
  supabase: SupabaseClient,
): Promise<ProposedMeal> {
  // Batch-load any cached foods that match this meal's items.
  const keys = meal.items.map((i) =>
    foodMatchKey(i.normalizedName, i.preparationState, i.brand),
  );
  const foodsByKey = new Map<string, FoodRow>();
  if (keys.length) {
    const { data } = await supabase
      .from("nutrition_foods")
      .select(
        "match_key,name,brand,preparation_state,basis,calories_per_100g,protein_per_100g,serving_calories,serving_protein_g,serving_grams,source_type,source_name,source_url,verified",
      )
      .in("match_key", keys);
    for (const row of (data ?? []) as FoodRow[]) foodsByKey.set(row.match_key, row);
  }

  // USDA lookups are independent — run them concurrently.
  const items = await Promise.all(
    meal.items.map((item) => resolveItem(item, supabase, foodsByKey)),
  );

  const totalCalories = round(
    items.reduce((s, it) => s + (it.calories ?? 0), 0),
    0,
  );
  const totalProteinGrams = round(
    items.reduce((s, it) => s + (it.proteinGrams ?? 0), 0),
    1,
  );

  return {
    mealType: meal.mealType,
    consumedAt: meal.consumedAt,
    originalText: meal.originalText,
    items,
    totalCalories,
    totalProteinGrams,
    assumptions: meal.assumptions,
    confidence: meal.confidence,
  };
}
