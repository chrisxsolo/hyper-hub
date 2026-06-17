import { describe, it, expect } from "vitest";
import {
  targetsOnDate,
  blankProposedItem,
  foodLibraryToProposed,
  savedFoodToProposed,
} from "./helpers";
import { claudeMealSchema, type SavedFood } from "./types";
import type { FoodLibraryEntry } from "../products/types";

describe("targetsOnDate (target history)", () => {
  const history = [
    { id: "1", effective_on: "2026-01-01", calorie_target: 2000, protein_target_g: 150 },
    { id: "2", effective_on: "2026-06-01", calorie_target: 2200, protein_target_g: 160 },
  ];
  const current = { calorie: 2200, protein: 160 };

  it("uses the target in effect on a past date", () => {
    expect(targetsOnDate(history, "2026-03-15", current).calorie).toBe(2000);
  });
  it("uses the newer target after its effective date", () => {
    expect(targetsOnDate(history, "2026-06-17", current).calorie).toBe(2200);
  });
  it("uses the earliest target before any history", () => {
    expect(targetsOnDate(history, "2025-12-01", current).calorie).toBe(2000);
  });
  it("falls back to current when no history exists", () => {
    const r = targetsOnDate([], "2026-06-17", current);
    expect(r.calorie).toBe(2200);
    expect(r.historical).toBe(false);
  });
});

describe("blankProposedItem", () => {
  it("creates a manual, editable zero item", () => {
    const it = blankProposedItem();
    expect(it.sourceType).toBe("manual");
    expect(it.calories).toBe(0);
    expect(it.verified).toBe(true);
  });
});

describe("foodLibraryToProposed (planner: Costco product → item)", () => {
  // A product whose nutrition label reads 200 kcal / 20 g protein per 100 g serving.
  const entry: FoodLibraryEntry = {
    productId: "p1",
    name: "Rotisserie Chicken",
    brand: "Kirkland",
    variant: null,
    category: "Meat & Seafood",
    imageUrl: null,
    isFavorite: false,
    lastTotalPrice: null,
    packageCount: null,
    totalWeight: null,
    weightUnit: null,
    nutrition: {
      id: "v1",
      product_id: "p1",
      serving_size_description: "100 g",
      serving_size_value: 100,
      serving_size_unit: "g",
      servings_per_container: null,
      calories: 200,
      total_fat_g: 8,
      saturated_fat_g: null,
      trans_fat_g: null,
      cholesterol_mg: null,
      sodium_mg: null,
      total_carbohydrate_g: 0,
      dietary_fiber_g: null,
      total_sugars_g: null,
      added_sugars_g: null,
      protein_g: 20,
      vitamin_d_mcg: null,
      calcium_mg: null,
      iron_mg: null,
      potassium_mg: null,
      additional_nutrients: null,
      source_image_url: null,
      recognition_confidence: null,
      notes: null,
      is_user_confirmed: true,
      is_current: true,
      observed_at: "2026-06-01",
      created_at: "2026-06-01",
    },
  };

  it("scales by grams and links the product/version", () => {
    const item = foodLibraryToProposed(entry, 150, "g");
    expect(item).not.toBeNull();
    expect(item!.calories).toBe(300); // 200 * 150/100
    expect(item!.proteinGrams).toBe(30); // 20 * 150/100
    expect(item!.caloriesPer100g).toBe(200);
    expect(item!.productId).toBe("p1");
    expect(item!.nutritionVersionId).toBe("v1");
  });

  it("returns null when the conversion is refused", () => {
    // A weight-based serving can't be logged by "item".
    expect(foodLibraryToProposed(entry, 1, "item")).toBeNull();
  });
});

describe("savedFoodToProposed (planner: saved food → item)", () => {
  const per100: SavedFood = {
    id: "f1", name: "Oats", brand: null, preparation_state: null,
    basis: "per_100g", calories_per_100g: 380, protein_per_100g: 13,
    serving_calories: null, serving_protein_g: null, serving_label: null,
    source_type: "personal", verified: true, times_logged: 3,
  };
  const perServing: SavedFood = {
    id: "f2", name: "Protein bar", brand: "Quest", preparation_state: null,
    basis: "per_serving", calories_per_100g: null, protein_per_100g: null,
    serving_calories: 200, serving_protein_g: 21, serving_label: "1 bar",
    source_type: "manufacturer", verified: true, times_logged: 5,
  };

  it("scales a per-100g food by a gram amount", () => {
    const item = savedFoodToProposed(per100, 50, "g");
    expect(item.calories).toBe(190); // 380 * 50/100
    expect(item.proteinGrams).toBe(6.5);
    expect(item.nutritionBasis).toBe("per_100g");
    expect(item.gramsEstimate).toBe(50);
  });

  it("scales a per-serving food by a serving multiplier", () => {
    const item = savedFoodToProposed(perServing, 2, "serving");
    expect(item.calories).toBe(400);
    expect(item.proteinGrams).toBe(42);
    expect(item.nutritionBasis).toBe("per_serving");
    expect(item.unit).toBe("serving");
  });
});

describe("invalid AI output rejection", () => {
  it("rejects malformed Claude output", () => {
    expect(claudeMealSchema.safeParse({ foo: "bar" }).success).toBe(false);
    expect(claudeMealSchema.safeParse({ mealType: "brunch", items: [] }).success).toBe(false);
  });
  it("accepts a well-formed parse", () => {
    const ok = claudeMealSchema.safeParse({
      mealType: "lunch",
      consumedAt: null,
      originalText: "2 eggs",
      assumptions: [],
      confidence: 0.8,
      items: [
        {
          originalPhrase: "2 eggs", normalizedName: "egg", brand: null,
          quantity: 2, quantityMin: null, quantityMax: null, unit: "item",
          preparationState: "large", gramsEstimate: 100, usdaQuery: "egg cooked",
          isRestaurant: false, calories: 156, proteinGrams: 12.6,
          nutritionBasis: "per_item", sourceType: "ai_estimate", sourceName: null,
          sourceUrl: null, confidence: 0.8, assumptions: ["Eggs interpreted as large"],
          requiresConfirmation: false,
        },
      ],
    });
    expect(ok.success).toBe(true);
  });
});
