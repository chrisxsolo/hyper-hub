// Client-safe pure helpers for the dashboard.

import { massToGrams, round } from "./units";
import { scaleNutrition } from "../products/serving";
import type { FoodLibraryEntry } from "../products/types";
import type { ProposedItem, SavedFood, TargetHistoryRow } from "./types";

export function blankProposedItem(): ProposedItem {
  return {
    originalPhrase: "",
    name: "",
    brand: null,
    quantity: 1,
    quantityMin: null,
    quantityMax: null,
    unit: "serving",
    preparationState: null,
    gramsEstimate: null,
    caloriesPer100g: null,
    proteinPer100g: null,
    calories: 0,
    proteinGrams: 0,
    perUnitCalories: 0,
    perUnitProtein: 0,
    nutritionBasis: "per_serving",
    sourceType: "manual",
    sourceName: null,
    sourceUrl: null,
    sourceRetrievedAt: null,
    confidence: 1,
    assumptions: [],
    requiresConfirmation: false,
    verified: true,
  };
}

/**
 * The calorie/protein target in effect on a given date, using the target-history
 * table. Falls back to the current target when no history applies. This is why
 * changing your target never rewrites old days — each day resolves to the target
 * that was active then.
 */
export function targetsOnDate(
  history: TargetHistoryRow[],
  date: string,
  current: { calorie: number; protein: number },
): { calorie: number; protein: number; historical: boolean } {
  if (!history.length) return { ...current, historical: false };
  const sorted = [...history].sort((a, b) => a.effective_on.localeCompare(b.effective_on));
  let chosen: TargetHistoryRow | null = null;
  for (const row of sorted) {
    if (row.effective_on <= date) chosen = row;
    else break;
  }
  // Before the first history row, use the earliest known target.
  const row = chosen ?? sorted[0];
  return {
    calorie: row.calorie_target,
    protein: row.protein_target_g,
    historical: chosen != null,
  };
}

// ── Source → ProposedItem mappers (for the meal planner) ───────────────────────
// These turn a Costco food-library product or a personal saved food into the
// editable ProposedItem shape the planner / EditableItemsTable work with, so a
// planned item can later be saved as a template or logged via the meals API.

/**
 * Scale a Costco food-library product to `amount` of `unit` and produce a
 * ProposedItem. Returns null when the conversion is refused (e.g. logging by
 * "item" against a weight-based serving) — the caller should surface the reason.
 * Carries the canonical product/version link so a logged plan stays linked.
 */
export function foodLibraryToProposed(
  entry: FoodLibraryEntry,
  amount: number,
  unit: string,
): ProposedItem | null {
  const res = scaleNutrition(entry.nutrition, amount, unit);
  if (!res.ok) return null;
  const s = res.snapshot;
  const grams = s.grams;
  const caloriesPer100g =
    grams && grams > 0 && s.calories != null ? round((s.calories / grams) * 100, 1) : null;
  const proteinPer100g =
    grams && grams > 0 && s.proteinG != null ? round((s.proteinG / grams) * 100, 2) : null;
  return {
    originalPhrase: `${amount} ${unit} ${entry.name}`,
    name: entry.name,
    brand: entry.brand,
    quantity: amount,
    quantityMin: null,
    quantityMax: null,
    unit,
    preparationState: null,
    gramsEstimate: grams,
    caloriesPer100g,
    proteinPer100g,
    calories: s.calories,
    proteinGrams: s.proteinG,
    perUnitCalories: s.calories != null && amount ? round(s.calories / amount, 1) : null,
    perUnitProtein: s.proteinG != null && amount ? round(s.proteinG / amount, 2) : null,
    nutritionBasis: grams ? "per_100g" : "per_serving",
    sourceType: "personal",
    sourceName: entry.brand ? `${entry.brand} · ${entry.name}` : entry.name,
    sourceUrl: null,
    sourceRetrievedAt: null,
    confidence: 1,
    assumptions: [],
    requiresConfirmation: false,
    verified: true,
    productId: entry.productId,
    nutritionVersionId: entry.nutrition.id,
    totalFatG: s.totalFatG,
    saturatedFatG: s.saturatedFatG,
    transFatG: s.transFatG,
    cholesterolMg: s.cholesterolMg,
    sodiumMg: s.sodiumMg,
    totalCarbohydrateG: s.totalCarbohydrateG,
    dietaryFiberG: s.dietaryFiberG,
    totalSugarsG: s.totalSugarsG,
    addedSugarsG: s.addedSugarsG,
  };
}

/**
 * Map a personal saved food (the `nutrition_foods` cache) to a ProposedItem.
 * Per-100g foods scale by a mass `amount`/`unit`; per-serving foods scale by a
 * serving multiplier (the `unit` is ignored and forced to "serving").
 */
export function savedFoodToProposed(food: SavedFood, amount: number, unit: string): ProposedItem {
  const per100 = food.basis === "per_100g";
  let grams: number | null = null;
  let calories: number | null = null;
  let proteinGrams: number | null = null;
  let caloriesPer100g: number | null = null;
  let proteinPer100g: number | null = null;

  if (per100) {
    grams = massToGrams(amount, unit) ?? amount; // default to grams when unit isn't a mass unit
    caloriesPer100g = food.calories_per_100g;
    proteinPer100g = food.protein_per_100g;
    calories = caloriesPer100g != null ? round((caloriesPer100g * grams) / 100, 0) : null;
    proteinGrams = proteinPer100g != null ? round((proteinPer100g * grams) / 100, 1) : null;
  } else {
    calories = food.serving_calories != null ? round(food.serving_calories * amount, 0) : null;
    proteinGrams = food.serving_protein_g != null ? round(food.serving_protein_g * amount, 1) : null;
  }

  return {
    originalPhrase: `${amount} ${per100 ? unit : "serving"} ${food.name}`,
    name: food.name,
    brand: food.brand,
    quantity: amount,
    quantityMin: null,
    quantityMax: null,
    unit: per100 ? unit : "serving",
    preparationState: food.preparation_state,
    gramsEstimate: grams,
    caloriesPer100g,
    proteinPer100g,
    calories,
    proteinGrams,
    perUnitCalories: calories != null && amount ? round(calories / amount, 1) : null,
    perUnitProtein: proteinGrams != null && amount ? round(proteinGrams / amount, 2) : null,
    nutritionBasis: per100 ? "per_100g" : "per_serving",
    sourceType: food.source_type,
    sourceName: food.name,
    sourceUrl: null,
    sourceRetrievedAt: null,
    confidence: 1,
    assumptions: [],
    requiresConfirmation: false,
    verified: food.verified,
  };
}
