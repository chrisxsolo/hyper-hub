// Client-safe pure helpers for the dashboard.

import type { ProposedItem, TargetHistoryRow } from "./types";

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
