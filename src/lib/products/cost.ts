// Cost-per-meal math (spec §8, §9): turn a product's package price + size into a
// price per gram, then sum the cost of a meal's product-linked items. Pure, no
// I/O — safe on server and client. Like the value metrics, it invents nothing:
// an item only contributes cost when it's linked to a product whose price AND
// gram-weight are both known, and meal-level ratios are shown only when EVERY
// item in the meal is priced (a partial total would overstate protein-per-$).

import { massToGrams, round } from "../nutrition/units";

function pos(n: number | null | undefined): number | null {
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : null;
}

// The pricing inputs we read off a product (overview row): a package price plus
// enough size data to know how many grams that price buys.
export type PackagePricing = {
  totalPrice: number | null;
  totalWeight: number | null;
  weightUnit: string | null;
  servingSizeValue: number | null;
  servingSizeUnit: string | null;
  servingsPerContainer: number | null;
};

// Total grams in a package, by the most reliable available method. Returns null
// for count-only products (e.g. "18 bars") where no gram weight is known — those
// can't be priced per gram, so their meals stay unpriced rather than guessed.
export function packageGrams(p: PackagePricing): number | null {
  // 1. Direct package weight (most reliable).
  if (p.totalWeight != null && p.weightUnit) {
    const g = massToGrams(p.totalWeight, p.weightUnit);
    if (pos(g) != null) return g;
  }
  // 2. servings-per-container × serving grams.
  const spc = pos(p.servingsPerContainer);
  const servingG =
    p.servingSizeValue != null && p.servingSizeUnit
      ? massToGrams(p.servingSizeValue, p.servingSizeUnit)
      : null;
  if (spc != null && pos(servingG) != null) return spc * (servingG as number);
  return null;
}

// Price of one gram of this product, or null when price/size is unknown. Kept at
// full precision — rounding happens once, on the summed meal cost.
export function pricePerGram(p: PackagePricing): number | null {
  const price = pos(p.totalPrice);
  const grams = packageGrams(p);
  if (price == null || grams == null || grams <= 0) return null;
  return price / grams;
}

// Just the fields buildMealCost needs from each meal item.
export type CostItem = { productId: string | null; grams: number | null };

export type MealCostSummary = {
  cost: number; // sum of priced items, rounded to cents
  pricedItems: number;
  totalItems: number;
  complete: boolean; // every item in the meal is priced
  proteinPerDollar: number | null; // only when complete (whole-meal protein ÷ cost)
  costPer100Cal: number | null; // only when complete
};

// Sum the cost of a meal's product-linked items. Returns null when nothing in the
// meal can be priced (so the UI shows no cost at all rather than "$0.00"). The
// per-dollar / per-100-cal ratios use the meal's own calorie & protein totals,
// and are only filled in when the cost is complete.
export function buildMealCost(
  items: CostItem[],
  pricePerGramByProduct: Map<string, number>,
  calories: number,
  proteinG: number,
): MealCostSummary | null {
  const totalItems = items.length;
  let cost = 0;
  let pricedItems = 0;
  for (const it of items) {
    if (!it.productId || it.grams == null || it.grams <= 0) continue;
    const ppg = pricePerGramByProduct.get(it.productId);
    if (ppg == null) continue;
    cost += it.grams * ppg;
    pricedItems += 1;
  }
  if (pricedItems === 0) return null;

  const roundedCost = round(cost, 2);
  const complete = pricedItems === totalItems;
  return {
    cost: roundedCost,
    pricedItems,
    totalItems,
    complete,
    proteinPerDollar:
      complete && roundedCost > 0 ? round(proteinG / roundedCost, 1) : null,
    costPer100Cal:
      complete && roundedCost > 0 && calories > 0 ? round((roundedCost * 100) / calories, 2) : null,
  };
}
