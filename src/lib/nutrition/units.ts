// Unit handling + small nutrition math. Pure, dependency-free, client-safe.

export const MASS_UNIT_TO_GRAMS: Record<string, number> = {
  g: 1, gram: 1, grams: 1, gm: 1, gs: 1,
  mg: 0.001, milligram: 0.001, milligrams: 0.001,
  kg: 1000, kilogram: 1000, kilograms: 1000,
  oz: 28.349523, ounce: 28.349523, ounces: 28.349523,
  lb: 453.59237, lbs: 453.59237, pound: 453.59237, pounds: 453.59237,
};

export function normalizeUnit(unit: string): string {
  return unit.trim().toLowerCase().replace(/\.$/, "");
}

/** Grams for `quantity` of `unit`, or null when the unit isn't a mass unit. */
export function massToGrams(quantity: number, unit: string): number | null {
  const factor = MASS_UNIT_TO_GRAMS[normalizeUnit(unit)];
  if (factor == null) return null;
  return quantity * factor;
}

/** Round to a sensible number of decimals for display/storage. */
export function round(n: number, decimals = 0): number {
  const p = 10 ** decimals;
  return Math.round(n * p) / p;
}

/**
 * Canonical key used to de-duplicate foods in the cache. Must match between the
 * server (cache read in the analyze route) and the client (cache write on save).
 */
export function foodMatchKey(
  name: string,
  prep?: string | null,
  brand?: string | null,
): string {
  const norm = (s?: string | null) =>
    (s ?? "").toLowerCase().trim().replace(/\s+/g, " ");
  return [norm(name), norm(prep), norm(brand)].join("|");
}

/** The quantity we should actually use for math, given a possible range. */
export function effectiveQuantity(
  quantity: number | null,
  min: number | null,
  max: number | null,
): number | null {
  if (quantity != null) return quantity;
  if (min != null && max != null) return (min + max) / 2;
  if (min != null) return min;
  if (max != null) return max;
  return null;
}

/**
 * Build the argument object for the `nutrition_cache_food` RPC from a food.
 * Chooses a per-100g anchor when grams are known (so future portions scale
 * exactly), otherwise a per-unit serving anchor. Returns null when there's no
 * calorie figure worth caching.
 */
export function buildCacheArgs(f: {
  name: string;
  brand?: string | null;
  preparationState?: string | null;
  calories: number | null;
  proteinGrams: number | null;
  grams?: number | null;
  quantity?: number | null;
  unit?: string | null;
  sourceType?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  verified?: boolean;
}): Record<string, unknown> | null {
  if (f.calories == null || !f.name.trim()) return null;
  const grams = f.grams ?? null;
  let basis = "per_serving";
  let caloriesPer100g: number | null = null;
  let proteinPer100g: number | null = null;
  let servingCalories: number | null = null;
  let servingProtein: number | null = null;
  let servingLabel: string | null = f.unit ?? "serving";

  if (grams && grams > 0) {
    basis = "per_100g";
    caloriesPer100g = round((f.calories / grams) * 100, 1);
    proteinPer100g = f.proteinGrams != null ? round((f.proteinGrams / grams) * 100, 2) : null;
    servingLabel = `${round(grams, 0)} g`;
  } else if (f.quantity && f.quantity > 0) {
    servingCalories = round(f.calories / f.quantity, 1);
    servingProtein = f.proteinGrams != null ? round(f.proteinGrams / f.quantity, 2) : null;
  } else {
    servingCalories = f.calories;
    servingProtein = f.proteinGrams;
  }

  return {
    p_match_key: foodMatchKey(f.name, f.preparationState, f.brand),
    p_name: f.name,
    p_brand: f.brand ?? null,
    p_preparation_state: f.preparationState ?? null,
    p_basis: basis,
    p_calories_per_100g: caloriesPer100g,
    p_protein_per_100g: proteinPer100g,
    p_serving_calories: servingCalories,
    p_serving_protein_g: servingProtein,
    p_serving_label: servingLabel,
    p_serving_grams: grams,
    p_source_type: f.sourceType ?? "manual",
    p_source_name: f.sourceName ?? null,
    p_source_url: f.sourceUrl ?? null,
    p_verified: f.verified ?? false,
  };
}

/** Common, friendly unit options for the editable review table. */
export const UNIT_OPTIONS = [
  "serving", "item", "piece", "slice",
  "g", "oz", "lb",
  "cup", "tbsp", "tsp", "ml", "fl oz",
  "handful", "scoop", "bowl", "plate",
] as const;
