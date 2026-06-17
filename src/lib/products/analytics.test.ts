import { describe, it, expect } from "vitest";
import { computeValueMetrics, type ValueInputs } from "./analytics";

// Spec §13 example: Kirkland chicken, $25.99, 6.5 lb, serving 112 g, 120 cal, 26 g protein.
const chickenInputs: ValueInputs = {
  totalPrice: 25.99,
  totalWeight: 6.5,
  weightUnit: "lb",
  packageCount: null,
  calories: 120,
  proteinG: 26,
  servingSizeValue: 112,
  servingSizeUnit: "g",
  servingsPerContainer: null,
};

describe("computeValueMetrics — weight-based product", () => {
  const m = computeValueMetrics(chickenInputs);
  it("derives servings per package from package ÷ serving grams", () => {
    // 6.5 lb = 2948.35 g; / 112 ≈ 26.3 servings
    expect(m.servingsPerPackage).toBe(26.3);
  });
  it("cost per serving ≈ $0.99", () => {
    expect(m.costPerServing).toBe(0.99);
  });
  it("protein per dollar uses package protein ÷ price", () => {
    // packageProtein = 26 × 26.3 = 683.8; / 25.99 ≈ 26.3 g/$
    expect(m.packageProtein).toBe(683.8);
    expect(m.proteinPerDollar).toBe(26.3);
  });
  it("protein per 100 cal is serving-independent", () => {
    // 26 / 120 × 100 ≈ 21.7
    expect(m.proteinPer100Cal).toBe(21.7);
  });
});

describe("computeValueMetrics — prefers printed servings-per-container", () => {
  it("uses the label count over computed weight", () => {
    const m = computeValueMetrics({ ...chickenInputs, servingsPerContainer: 25 });
    expect(m.servingsPerPackage).toBe(25);
    expect(m.costPerServing).toBe(round2(25.99 / 25));
  });
});

describe("computeValueMetrics — count-based multipack", () => {
  it("18 shakes → cost per item and per-shake macros (spec §11)", () => {
    const m = computeValueMetrics({
      totalPrice: 23.99,
      totalWeight: null,
      weightUnit: null,
      packageCount: 18,
      calories: 160,
      proteinG: 30,
      servingSizeValue: 1,
      servingSizeUnit: "shake",
      servingsPerContainer: null,
    });
    expect(m.servingsPerPackage).toBe(18);
    expect(m.costPerItem).toBe(1.33);
    expect(m.costPerServing).toBe(1.33);
    expect(m.packageProtein).toBe(540);
  });
});

describe("computeValueMetrics — missing inputs never invent a value (spec §13)", () => {
  it("returns null metrics when price is unknown", () => {
    const m = computeValueMetrics({ ...chickenInputs, totalPrice: null });
    expect(m.costPerServing).toBe(null);
    expect(m.caloriesPerDollar).toBe(null);
    expect(m.proteinPerDollar).toBe(null);
    // servings-per-package is independent of price, so it still computes
    expect(m.servingsPerPackage).toBe(26.3);
  });
  it("returns null servings/package when neither weight nor count is known", () => {
    const m = computeValueMetrics({
      ...chickenInputs,
      totalWeight: null,
      weightUnit: null,
      servingsPerContainer: null,
    });
    expect(m.servingsPerPackage).toBe(null);
    expect(m.costPerServing).toBe(null);
    expect(m.packageProtein).toBe(null);
    // per-100-cal still works (no package data needed)
    expect(m.proteinPer100Cal).toBe(21.7);
  });
});

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
