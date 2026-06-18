import { describe, it, expect } from "vitest";
import { packageGrams, pricePerGram, buildMealCost, type PackagePricing } from "./cost";

// Spec §13 chicken: $25.99 for 6.5 lb (≈ 2948 g) → ≈ $0.0088 per gram.
const chicken: PackagePricing = {
  totalPrice: 25.99,
  totalWeight: 6.5,
  weightUnit: "lb",
  servingSizeValue: 112,
  servingSizeUnit: "g",
  servingsPerContainer: null,
};

describe("packageGrams", () => {
  it("uses direct package weight", () => {
    expect(packageGrams(chicken)).toBeCloseTo(2948.35, 1);
  });

  it("falls back to servings × serving grams when no weight", () => {
    expect(
      packageGrams({
        totalPrice: 10,
        totalWeight: null,
        weightUnit: null,
        servingSizeValue: 100,
        servingSizeUnit: "g",
        servingsPerContainer: 10,
      }),
    ).toBe(1000);
  });

  it("is null for count-only products with no gram weight", () => {
    expect(
      packageGrams({
        totalPrice: 23.99,
        totalWeight: null,
        weightUnit: null,
        servingSizeValue: 1,
        servingSizeUnit: "shake", // not a mass unit → can't derive grams
        servingsPerContainer: 18,
      }),
    ).toBe(null);
  });
});

describe("pricePerGram", () => {
  it("derives price per gram from package price ÷ grams", () => {
    expect(pricePerGram(chicken)).toBeCloseTo(25.99 / 2948.35, 6);
  });

  it("is null without a price", () => {
    expect(pricePerGram({ ...chicken, totalPrice: null })).toBe(null);
  });
});

describe("buildMealCost", () => {
  const ppg = pricePerGram(chicken)!; // ≈ 0.008815 / g
  const map = new Map<string, number>([["chicken", ppg]]);

  it("prices a fully-linked meal and derives the value ratios", () => {
    // 200 g of chicken ≈ $1.76; meal totals 240 cal / 52 g protein.
    const c = buildMealCost([{ productId: "chicken", grams: 200 }], map, 240, 52)!;
    expect(c.cost).toBe(1.76);
    expect(c.complete).toBe(true);
    expect(c.pricedItems).toBe(1);
    expect(c.totalItems).toBe(1);
    expect(c.proteinPerDollar).toBe(29.5); // 52 / 1.76
    expect(c.costPer100Cal).toBe(0.73); // 1.76 × 100 / 240
  });

  it("reports a partial total and withholds ratios when some items are unpriced", () => {
    const c = buildMealCost(
      [
        { productId: "chicken", grams: 200 },
        { productId: "rice", grams: 150 }, // not in the price map
      ],
      map,
      500,
      55,
    )!;
    expect(c.cost).toBe(1.76);
    expect(c.complete).toBe(false);
    expect(c.pricedItems).toBe(1);
    expect(c.totalItems).toBe(2);
    expect(c.proteinPerDollar).toBe(null);
    expect(c.costPer100Cal).toBe(null);
  });

  it("returns null when nothing in the meal can be priced", () => {
    expect(buildMealCost([{ productId: null, grams: 100 }], map, 200, 10)).toBe(null);
    expect(buildMealCost([{ productId: "chicken", grams: null }], map, 200, 10)).toBe(null);
    expect(buildMealCost([{ productId: "unknown", grams: 100 }], map, 200, 10)).toBe(null);
  });
});
