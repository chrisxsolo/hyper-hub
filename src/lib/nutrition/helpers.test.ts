import { describe, it, expect } from "vitest";
import { targetsOnDate, blankProposedItem } from "./helpers";
import { claudeMealSchema } from "./types";

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
