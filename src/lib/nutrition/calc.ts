// Pure nutrition + aggregation math, isolated for testing. No I/O, no framework.

import { round } from "./units";

/** Calories/protein for a portion given a per-100g figure and total grams. */
export function scaleByGrams(per100g: number, grams: number): number {
  return (per100g * grams) / 100;
}

/** Calories/protein for `qty` servings given the per-serving figure. */
export function scaleByServing(perServing: number, qty: number): number {
  return perServing * qty;
}

export type MacroItem = { calories: number | null; proteinGrams: number | null };

/** Sum item calories/protein with sensible display rounding (kcal whole, protein 1dp). */
export function mealTotals(items: MacroItem[]): { calories: number; proteinGrams: number } {
  const calories = round(items.reduce((s, it) => s + (it.calories ?? 0), 0), 0);
  const proteinGrams = round(items.reduce((s, it) => s + (it.proteinGrams ?? 0), 0), 1);
  return { calories, proteinGrams };
}

export type DayTotalRow = { eaten_on: string; total_calories: number; total_protein_g: number };

/** Aggregate meals into per-day calorie/protein totals. */
export function aggregateByDay(meals: DayTotalRow[]): Map<string, { cal: number; prot: number }> {
  const m = new Map<string, { cal: number; prot: number }>();
  for (const meal of meals) {
    const prev = m.get(meal.eaten_on) ?? { cal: 0, prot: 0 };
    prev.cal += Number(meal.total_calories);
    prev.prot += Number(meal.total_protein_g);
    m.set(meal.eaten_on, prev);
  }
  return m;
}

/**
 * Average over LOGGED days only (days with no data don't drag the average to
 * zero). Returns 0 for an empty input rather than NaN.
 */
export function averageOverLoggedDays(values: number[]): number {
  const logged = values.filter((v) => v > 0);
  if (logged.length === 0) return 0;
  return round(logged.reduce((a, b) => a + b, 0) / logged.length, 0);
}

/** Find the first saved alias phrase contained in (or equal to) the text. */
export function findAliasPhrase(
  aliases: { phrase: string; template_id: string | null }[],
  text: string,
): { phrase: string; template_id: string | null } | null {
  const norm = text.toLowerCase().trim();
  for (const a of aliases) {
    const p = a.phrase.toLowerCase().trim();
    if (a.template_id && (norm === p || norm.includes(p))) return a;
  }
  return null;
}
