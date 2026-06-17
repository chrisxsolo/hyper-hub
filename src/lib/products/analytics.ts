// Pure value-metric math: price ↔ nutrition. Derives cost-per-serving,
// calories/protein per dollar, etc. EVERY metric is null when any required input
// is missing — we never overstate accuracy by inventing a value (spec §13).
// No I/O; reuses the mass conversion + rounding from nutrition/units.

import { massToGrams, normalizeUnit, round } from "../nutrition/units";
import type { ProductValueMetrics } from "./types";

const COUNT_SERVING_UNITS = new Set([
  "item", "items", "piece", "pieces", "each", "ct", "count", "bar", "bars",
  "cookie", "cookies", "slice", "slices", "packet", "packets", "pouch", "pouches",
  "scoop", "scoops", "shake", "shakes", "can", "cans", "bottle", "bottles",
]);

export type ValueInputs = {
  totalPrice: number | null;
  totalWeight: number | null;
  weightUnit: string | null;
  packageCount: number | null;
  calories: number | null;
  proteinG: number | null;
  servingSizeValue: number | null;
  servingSizeUnit: string | null;
  servingsPerContainer: number | null;
};

function pos(n: number | null | undefined): number | null {
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : null;
}

// How many servings the package holds, by the most reliable available method.
function servingsPerPackage(i: ValueInputs): number | null {
  // 1. Printed on the label — most authoritative.
  const printed = pos(i.servingsPerContainer);
  if (printed != null) return round(printed, 1);

  // 2. Weight-based: package grams ÷ serving grams.
  const packageGrams =
    i.totalWeight != null && i.weightUnit ? massToGrams(i.totalWeight, i.weightUnit) : null;
  const servingGrams =
    i.servingSizeValue != null && i.servingSizeUnit
      ? massToGrams(i.servingSizeValue, i.servingSizeUnit)
      : null;
  if (pos(packageGrams) != null && pos(servingGrams) != null) {
    return round((packageGrams as number) / (servingGrams as number), 1);
  }

  // 3. Count-based multipack where one serving is N items.
  const count = pos(i.packageCount);
  const unit = i.servingSizeUnit ? normalizeUnit(i.servingSizeUnit) : null;
  if (count != null && (unit == null || COUNT_SERVING_UNITS.has(unit))) {
    const perServing = pos(i.servingSizeValue) ?? 1;
    return round(count / perServing, 1);
  }

  return null;
}

export function computeValueMetrics(i: ValueInputs): ProductValueMetrics {
  const price = pos(i.totalPrice);
  const spp = servingsPerPackage(i);
  const calories = pos(i.calories);
  const protein = i.proteinG != null && i.proteinG >= 0 ? i.proteinG : null;
  const count = pos(i.packageCount);

  const packageCalories = calories != null && spp != null ? round(calories * spp, 0) : null;
  const packageProtein = protein != null && spp != null ? round(protein * spp, 1) : null;

  return {
    servingsPerPackage: spp,
    costPerServing: price != null && spp != null && spp > 0 ? round(price / spp, 2) : null,
    costPerItem: price != null && count != null ? round(price / count, 2) : null,
    caloriesPerDollar: packageCalories != null && price != null ? round(packageCalories / price, 0) : null,
    proteinPerDollar: packageProtein != null && price != null ? round(packageProtein / price, 1) : null,
    proteinPer100Cal:
      protein != null && calories != null ? round((protein / calories) * 100, 1) : null,
    costPerGramProtein:
      price != null && packageProtein != null && packageProtein > 0
        ? round(price / packageProtein, 3)
        : null,
    packageCalories,
    packageProtein,
  };
}
