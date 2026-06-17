import { describe, it, expect } from "vitest";
import { scaleNutrition, type ScalableNutrition } from "./serving";

// A weight-based serving: 112 g, 120 cal, 26 g protein (the spec's chicken).
const chicken: ScalableNutrition = {
  serving_size_value: 112,
  serving_size_unit: "g",
  calories: 120,
  protein_g: 26,
  total_fat_g: 2.5,
  saturated_fat_g: 0.5,
  trans_fat_g: 0,
  cholesterol_mg: 75,
  sodium_mg: 75,
  total_carbohydrate_g: 0,
  dietary_fiber_g: 0,
  total_sugars_g: 0,
  added_sugars_g: 0,
};

// A count-based serving: 1 shake, 160 cal, 30 g protein.
const shake: ScalableNutrition = {
  serving_size_value: 1,
  serving_size_unit: "shake",
  calories: 160,
  protein_g: 30,
  total_fat_g: 2.5,
  saturated_fat_g: 0.5,
  trans_fat_g: 0,
  cholesterol_mg: 5,
  sodium_mg: 200,
  total_carbohydrate_g: 9,
  dietary_fiber_g: 1,
  total_sugars_g: 1,
  added_sugars_g: 0,
};

describe("scaleNutrition — weight-based serving", () => {
  it("scales every nutrient proportionally when logging 200 g (spec §10)", () => {
    const r = scaleNutrition(chicken, 200, "g");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // 200 / 112 ≈ 1.7857
    expect(r.snapshot.calories).toBe(214); // 120 × 1.7857
    expect(r.snapshot.proteinG).toBe(46.4); // 26 × 1.7857
    expect(r.snapshot.grams).toBe(200);
  });
  it("logging '1 serving' equals the per-serving values", () => {
    const r = scaleNutrition(chicken, 1, "serving");
    expect(r.ok && r.snapshot.calories).toBe(120);
    expect(r.ok && r.snapshot.proteinG).toBe(26);
    expect(r.ok && r.snapshot.grams).toBe(112);
  });
  it("converts ounces to the serving's gram basis", () => {
    const r = scaleNutrition(chicken, 4, "oz"); // 113.4 g ≈ 1.0124 servings
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.snapshot.calories).toBe(121);
  });
  it("refuses fl oz when the serving is weight-based (no density)", () => {
    const r = scaleNutrition(chicken, 8, "fl oz");
    expect(r.ok).toBe(false);
  });
});

describe("scaleNutrition — count-based serving", () => {
  it("defaults one item to one serving (multipack, spec §11)", () => {
    const r = scaleNutrition(shake, 1, "item");
    expect(r.ok && r.snapshot.calories).toBe(160);
    expect(r.ok && r.snapshot.proteinG).toBe(30);
  });
  it("scales by number of items", () => {
    const r = scaleNutrition(shake, 2, "item");
    expect(r.ok && r.snapshot.calories).toBe(320);
    expect(r.ok && r.snapshot.proteinG).toBe(60);
  });
  it("refuses grams when the serving is count-based without a known weight", () => {
    const r = scaleNutrition(shake, 100, "g");
    expect(r.ok).toBe(false);
  });
});

describe("scaleNutrition — guards", () => {
  it("rejects a zero or negative amount", () => {
    expect(scaleNutrition(chicken, 0, "g").ok).toBe(false);
    expect(scaleNutrition(chicken, -5, "g").ok).toBe(false);
  });
  it("keeps null nutrients null after scaling", () => {
    const r = scaleNutrition({ ...chicken, total_sugars_g: null }, 200, "g");
    expect(r.ok && r.snapshot.totalSugarsG).toBe(null);
  });
});
