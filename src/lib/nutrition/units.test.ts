import { describe, it, expect } from "vitest";
import {
  massToGrams, normalizeUnit, round, foodMatchKey, effectiveQuantity, buildCacheArgs,
} from "./units";

describe("unit conversions", () => {
  it("converts mass units to grams", () => {
    expect(massToGrams(1, "g")).toBe(1);
    expect(massToGrams(1, "kg")).toBe(1000);
    expect(massToGrams(1, "oz")).toBeCloseTo(28.3495, 3);
    expect(massToGrams(1, "lb")).toBeCloseTo(453.592, 2);
    expect(massToGrams(175, "g")).toBe(175);
  });
  it("normalizes unit strings", () => {
    expect(normalizeUnit(" OZ.")).toBe("oz");
    expect(normalizeUnit("Grams")).toBe("grams");
  });
  it("returns null for non-mass units", () => {
    expect(massToGrams(1, "cup")).toBeNull();
    expect(massToGrams(1, "serving")).toBeNull();
  });
});

describe("rounding behavior", () => {
  it("rounds to whole numbers and one decimal", () => {
    expect(round(289.6)).toBe(290);
    expect(round(54.34, 1)).toBe(54.3);
    expect(round(54.35, 1)).toBe(54.4);
    expect(round(0.04, 2)).toBe(0.04);
  });
  it("avoids float accumulation drift via explicit rounding", () => {
    // 0.1 + 0.2 = 0.30000000000000004 — rounding keeps it sane.
    expect(round(0.1 + 0.2, 1)).toBe(0.3);
  });
});

describe("quantity-range handling", () => {
  it("uses the explicit quantity when present", () => {
    expect(effectiveQuantity(175, null, null)).toBe(175);
  });
  it("uses the midpoint of a range", () => {
    expect(effectiveQuantity(null, 175, 285)).toBe(230);
  });
  it("falls back to a single bound, else null", () => {
    expect(effectiveQuantity(null, 100, null)).toBe(100);
    expect(effectiveQuantity(null, null, null)).toBeNull();
  });
});

describe("foodMatchKey", () => {
  it("normalizes name/prep/brand into a stable key", () => {
    expect(foodMatchKey("  Chicken Breast ", "Cooked", null)).toBe("chicken breast|cooked|");
    expect(foodMatchKey("4x4", null, "In-N-Out")).toBe("4x4||in-n-out");
  });
});

describe("buildCacheArgs", () => {
  it("derives a per-100g anchor when grams are known", () => {
    const args = buildCacheArgs({
      name: "chicken breast", brand: null, preparationState: "cooked",
      calories: 289, proteinGrams: 54.3, grams: 175, quantity: 175, unit: "g",
      sourceType: "usda", verified: true,
    });
    expect(args?.p_basis).toBe("per_100g");
    expect(args?.p_calories_per_100g).toBeCloseTo(165.1, 1);
    expect(args?.p_protein_per_100g).toBeCloseTo(31.03, 1);
  });
  it("derives a per-serving anchor when grams are unknown", () => {
    const args = buildCacheArgs({
      name: "4x4 burger", brand: "In-N-Out", calories: 670, proteinGrams: 39,
      grams: null, quantity: 1, unit: "item", sourceType: "official_restaurant",
    });
    expect(args?.p_basis).toBe("per_serving");
    expect(args?.p_serving_calories).toBe(670);
  });
  it("returns null when there is nothing to cache", () => {
    expect(buildCacheArgs({ name: "mystery", calories: null, proteinGrams: null })).toBeNull();
  });
});
