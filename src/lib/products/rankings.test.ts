import { describe, it, expect } from "vitest";
import type { ProductOverview } from "./types";
import {
  withMetrics,
  rankBy,
  dataGap,
  partitionForMetric,
  valueInputsFromOverview,
  metricNeedsPrice,
} from "./rankings";

// Minimal overview-row factory: everything null/empty unless overridden.
function mk(overrides: Partial<ProductOverview>): ProductOverview {
  return {
    id: overrides.id ?? "x",
    name: "Product",
    brand: null,
    variant: null,
    category: null,
    barcode: null,
    costco_item_number: null,
    package_count: null,
    package_size: null,
    package_unit: null,
    total_weight: null,
    weight_unit: null,
    total_volume: null,
    volume_unit: null,
    standard_unit: null,
    preferred_quantity: null,
    notes: null,
    image_url: null,
    is_favorite: false,
    times_purchased: 0,
    last_purchased_at: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    last_total_price: null,
    last_unit_price: null,
    last_unit_type: null,
    last_store_name: null,
    last_observed_at: null,
    price_count: 0,
    nutrition_version_id: null,
    n_calories: null,
    n_protein_g: null,
    n_serving_desc: null,
    n_serving_value: null,
    n_serving_unit: null,
    n_servings_per_container: null,
    has_nutrition: false,
    primary_image_url: null,
    imageUrl: null,
    ...overrides,
  };
}

// Spec §13 chicken: lean, cheap protein. Best protein/$ and protein-density.
const chicken = mk({
  id: "chicken",
  name: "Kirkland Chicken Breast",
  last_total_price: 25.99,
  total_weight: 6.5,
  weight_unit: "lb",
  n_calories: 120,
  n_protein_g: 26,
  n_serving_value: 112,
  n_serving_unit: "g",
  has_nutrition: true,
});

// Almonds: calorie-dense, weak protein, but cheap per serving and big calories/$.
const almonds = mk({
  id: "almonds",
  name: "Almonds",
  last_total_price: 15.99,
  total_weight: 3,
  weight_unit: "lb",
  n_calories: 170,
  n_protein_g: 6,
  n_serving_value: 28,
  n_serving_unit: "g",
  has_nutrition: true,
});

const sodaNoNutrition = mk({ id: "soda", name: "Soda", last_total_price: 9.99, has_nutrition: false });
const mysteryNoPrice = mk({
  id: "mystery",
  name: "Mystery Box",
  n_calories: 200,
  n_protein_g: 10,
  has_nutrition: true,
});

describe("valueInputsFromOverview", () => {
  it("maps overview columns onto computeValueMetrics inputs", () => {
    expect(valueInputsFromOverview(chicken)).toEqual({
      totalPrice: 25.99,
      totalWeight: 6.5,
      weightUnit: "lb",
      packageCount: null,
      calories: 120,
      proteinG: 26,
      servingSizeValue: 112,
      servingSizeUnit: "g",
      servingsPerContainer: null,
    });
  });
});

describe("rankBy — direction + exclusion", () => {
  const items = withMetrics([almonds, chicken, sodaNoNutrition, mysteryNoPrice]);

  it("ranks protein-per-dollar high→low and excludes products with no value", () => {
    const ranked = rankBy(items, "proteinPerDollar").map((r) => r.product.id);
    expect(ranked).toEqual(["chicken", "almonds"]); // soda/mystery have no metric
  });

  it("ranks cost-per-serving low→high (cheaper first)", () => {
    const ranked = rankBy(items, "costPerServing").map((r) => r.product.id);
    // almonds ≈ $0.33/serving < chicken ≈ $0.99/serving
    expect(ranked).toEqual(["almonds", "chicken"]);
  });

  it("ranks calories-per-dollar high→low (almonds are far denser)", () => {
    const ranked = rankBy(items, "caloriesPerDollar").map((r) => r.product.id);
    expect(ranked).toEqual(["almonds", "chicken"]);
  });

  it("ranks lean-protein density high→low — and needs no price, so 'mystery' qualifies", () => {
    // protein/100cal: chicken 21.7 > mystery 5.0 > almonds 3.5. mysteryNoPrice has
    // nutrition but no price, yet still ranks here (density is price-independent).
    const ranked = rankBy(items, "proteinPer100Cal").map((r) => r.product.id);
    expect(ranked).toEqual(["chicken", "mystery", "almonds"]);
  });
});

describe("metricNeedsPrice", () => {
  it("is false only for protein-per-100-calories", () => {
    expect(metricNeedsPrice("proteinPer100Cal")).toBe(false);
    expect(metricNeedsPrice("proteinPerDollar")).toBe(true);
    expect(metricNeedsPrice("costPerServing")).toBe(true);
    expect(metricNeedsPrice("caloriesPerDollar")).toBe(true);
  });
});

describe("rankBy — stable tie-break by name", () => {
  it("orders equal values alphabetically", () => {
    const a = mk({ id: "z", name: "Zucchini Chips", last_total_price: 10, total_weight: 1, weight_unit: "lb", n_calories: 100, n_protein_g: 5, n_serving_value: 50, n_serving_unit: "g", has_nutrition: true });
    const b = mk({ id: "a", name: "Apple Chips", last_total_price: 10, total_weight: 1, weight_unit: "lb", n_calories: 100, n_protein_g: 5, n_serving_value: 50, n_serving_unit: "g", has_nutrition: true });
    const ranked = rankBy(withMetrics([a, b]), "proteinPerDollar").map((r) => r.product.id);
    expect(ranked).toEqual(["a", "z"]); // identical metric → "Apple" before "Zucchini"
  });
});

describe("dataGap + partitionForMetric", () => {
  it("flags the missing input per product", () => {
    expect(dataGap(sodaNoNutrition)).toEqual({ needsPrice: false, needsNutrition: true });
    expect(dataGap(mysteryNoPrice)).toEqual({ needsPrice: true, needsNutrition: false });
    expect(dataGap(chicken)).toEqual({ needsPrice: false, needsNutrition: false });
  });

  it("separates rankable products from the ones still missing data", () => {
    const items = withMetrics([chicken, almonds, sodaNoNutrition, mysteryNoPrice]);
    const { ranked, unranked } = partitionForMetric(items, "proteinPerDollar");
    expect(ranked.map((r) => r.product.id)).toEqual(["chicken", "almonds"]);
    expect(unranked.map((r) => r.product.id).sort()).toEqual(["mystery", "soda"]);
  });
});
