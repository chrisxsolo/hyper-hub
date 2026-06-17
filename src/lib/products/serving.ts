// Pure serving math for logging a Costco product into the calorie tracker.
// Given a confirmed per-serving nutrition version and an amount the user
// actually ate (in grams, ounces, servings, items, …), scale EVERY nutrient
// proportionally. Only conversions that make mathematical/biological sense are
// allowed — e.g. fl oz → grams is refused unless the serving itself is
// volume-based (spec §10). No I/O; safe on server or client and easy to test.

import { massToGrams, normalizeUnit, round } from "../nutrition/units";

const VOLUME_UNIT_TO_ML: Record<string, number> = {
  ml: 1, milliliter: 1, milliliters: 1,
  l: 1000, liter: 1000, liters: 1000, litre: 1000, litres: 1000,
  "fl oz": 29.5735, floz: 29.5735, "fluid ounce": 29.5735, "fluid ounces": 29.5735,
};

const SERVING_UNITS = new Set(["serving", "servings", "svg", "portion", "portions"]);
const COUNT_UNITS = new Set([
  "item", "items", "piece", "pieces", "each", "ct", "count",
  "bar", "bars", "cookie", "cookies", "slice", "slices", "packet", "packets",
  "pouch", "pouches", "scoop", "scoops", "shake", "shakes", "can", "cans", "bottle", "bottles",
]);

// Units offered in the serving-entry sheet (plus the product's own serving).
export const LOG_UNIT_OPTIONS = ["serving", "g", "oz", "lb", "ml", "fl oz", "item"] as const;

function volumeToMl(quantity: number, unit: string): number | null {
  const f = VOLUME_UNIT_TO_ML[normalizeUnit(unit)];
  return f == null ? null : quantity * f;
}

// The per-serving nutrient fields scaling needs. DbCostcoProductNutritionVersion
// is structurally assignable to this.
export type ScalableNutrition = {
  serving_size_value: number | null;
  serving_size_unit: string | null;
  calories: number | null;
  protein_g: number | null;
  total_fat_g: number | null;
  saturated_fat_g: number | null;
  trans_fat_g: number | null;
  cholesterol_mg: number | null;
  sodium_mg: number | null;
  total_carbohydrate_g: number | null;
  dietary_fiber_g: number | null;
  total_sugars_g: number | null;
  added_sugars_g: number | null;
};

export type NutrientSnapshot = {
  calories: number | null;
  proteinG: number | null;
  totalFatG: number | null;
  saturatedFatG: number | null;
  transFatG: number | null;
  cholesterolMg: number | null;
  sodiumMg: number | null;
  totalCarbohydrateG: number | null;
  dietaryFiberG: number | null;
  totalSugarsG: number | null;
  addedSugarsG: number | null;
  grams: number | null; // gram weight of the logged amount, when known
};

export type ScaleResult =
  | { ok: true; factor: number; snapshot: NutrientSnapshot }
  | { ok: false; reason: string };

function scaleField(v: number | null, factor: number, dp: number): number | null {
  return v == null ? null : round(v * factor, dp);
}

/**
 * Scale a per-serving nutrition version to `amount` of `unit`.
 * `factor` is multiples of one serving.
 */
export function scaleNutrition(
  n: ScalableNutrition,
  amount: number,
  unit: string,
): ScaleResult {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, reason: "Enter an amount greater than zero." };
  }
  const u = normalizeUnit(unit);

  const servingGrams =
    n.serving_size_unit != null ? massToGrams(n.serving_size_value ?? 1, n.serving_size_unit) : null;
  const servingMl =
    n.serving_size_unit != null ? volumeToMl(n.serving_size_value ?? 1, n.serving_size_unit) : null;
  const servingIsCount = servingGrams == null && servingMl == null;

  let factor: number;
  let grams: number | null = null;

  if (SERVING_UNITS.has(u)) {
    factor = amount;
    grams = servingGrams != null ? round(amount * servingGrams, 1) : null;
  } else if (massToGrams(1, u) != null) {
    // logging by weight
    if (servingGrams == null || servingGrams <= 0) {
      return { ok: false, reason: "This product's serving isn't measured by weight, so a weight amount can't be converted." };
    }
    const g = massToGrams(amount, u) as number;
    factor = g / servingGrams;
    grams = round(g, 1);
  } else if (volumeToMl(1, u) != null) {
    // logging by volume
    if (servingMl == null || servingMl <= 0) {
      return { ok: false, reason: "This product's serving isn't measured by volume, so a volume amount can't be converted." };
    }
    factor = (volumeToMl(amount, u) as number) / servingMl;
  } else if (COUNT_UNITS.has(u)) {
    // logging by item/piece
    if (!servingIsCount) {
      return { ok: false, reason: "This product's serving is measured by weight, so logging by item needs a known per-item weight." };
    }
    const perServing = n.serving_size_value && n.serving_size_value > 0 ? n.serving_size_value : 1;
    factor = amount / perServing;
  } else {
    return { ok: false, reason: `Can't log by "${unit}" for this product.` };
  }

  const snapshot: NutrientSnapshot = {
    calories: scaleField(n.calories, factor, 0),
    proteinG: scaleField(n.protein_g, factor, 1),
    totalFatG: scaleField(n.total_fat_g, factor, 1),
    saturatedFatG: scaleField(n.saturated_fat_g, factor, 1),
    transFatG: scaleField(n.trans_fat_g, factor, 1),
    cholesterolMg: scaleField(n.cholesterol_mg, factor, 0),
    sodiumMg: scaleField(n.sodium_mg, factor, 0),
    totalCarbohydrateG: scaleField(n.total_carbohydrate_g, factor, 1),
    dietaryFiberG: scaleField(n.dietary_fiber_g, factor, 1),
    totalSugarsG: scaleField(n.total_sugars_g, factor, 1),
    addedSugarsG: scaleField(n.added_sugars_g, factor, 1),
    grams,
  };

  return { ok: true, factor: round(factor, 4), snapshot };
}
