// Pure unit-price math. Given a total price plus whatever size/weight/count we
// know, derive price-per-pound, price-per-ounce, price-per-item, and pick the
// single most useful "standard unit" to store and sort by. No I/O — safe to use
// on the server or in tests.

import type { UnitPricing } from "./types";

export function round(n: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round((n + Number.EPSILON) * f) / f;
}

// Convert a weight in an arbitrary unit to pounds. Returns null if unknown.
export function toPounds(weight: number | null, unit: string | null): number | null {
  if (weight == null || weight <= 0 || !unit) return null;
  const u = unit.trim().toLowerCase();
  if (["lb", "lbs", "pound", "pounds"].includes(u)) return weight;
  if (["oz", "ounce", "ounces"].includes(u)) return weight / 16;
  if (["g", "gram", "grams"].includes(u)) return weight / 453.59237;
  if (["kg", "kilogram", "kilograms"].includes(u)) return weight * 2.2046226;
  return null;
}

type PricingInput = {
  totalPrice: number | null;
  totalWeight?: number | null;
  weightUnit?: string | null;
  packageCount?: number | null;
  // Values Claude may already have read off a shelf label — trusted as hints.
  pricePerLb?: number | null;
  pricePerOz?: number | null;
  pricePerItem?: number | null;
};

// Derive the full unit-pricing summary. Computed values win when we can compute
// them from price + size; otherwise we fall back to any values read off the
// label, so a shelf-label "$3.94/lb" still flows through even without a weight.
export function computeUnitPricing(input: PricingInput): UnitPricing {
  const { totalPrice } = input;
  const lb = toPounds(input.totalWeight ?? null, input.weightUnit ?? null);

  let pricePerLb: number | null = null;
  let pricePerOz: number | null = null;
  let pricePerItem: number | null = null;

  if (totalPrice != null && lb && lb > 0) {
    pricePerLb = round(totalPrice / lb, 2);
    pricePerOz = round(totalPrice / (lb * 16), 3);
  }
  if (totalPrice != null && input.packageCount && input.packageCount > 0) {
    pricePerItem = round(totalPrice / input.packageCount, 2);
  }

  // Fall back to label-read hints when we couldn't compute.
  pricePerLb = pricePerLb ?? finite(input.pricePerLb);
  pricePerOz = pricePerOz ?? finite(input.pricePerOz);
  pricePerItem = pricePerItem ?? finite(input.pricePerItem);
  if (pricePerLb != null && pricePerOz == null) pricePerOz = round(pricePerLb / 16, 3);

  // Pick the primary standard unit: weight-based products sort by $/lb;
  // genuine multipacks sort by $/item; everything else has no unit price.
  let unitType: string | null = null;
  let unitPrice: number | null = null;
  if (pricePerLb != null) {
    unitType = "lb";
    unitPrice = pricePerLb;
  } else if (pricePerItem != null && (input.packageCount ?? 0) > 1) {
    unitType = "item";
    unitPrice = pricePerItem;
  }

  return {
    unitType,
    unitPrice,
    pricePerLb,
    pricePerOz,
    pricePerItem,
    standardUnit: unitType,
  };
}

function finite(n: number | null | undefined): number | null {
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : null;
}

// Human-readable unit price, e.g. "$3.94/lb", "$0.35/egg → item", "$0.22/oz".
export function formatUnitPrice(unitPrice: number | null, unitType: string | null): string | null {
  if (unitPrice == null || !unitType) return null;
  const label = unitType === "item" ? "ea" : unitType;
  return `$${unitPrice.toFixed(unitType === "oz" ? 3 : 2)}/${label}`;
}
