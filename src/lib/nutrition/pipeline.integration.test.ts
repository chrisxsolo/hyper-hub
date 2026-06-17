import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseMeal } from "./claude";
import { resolveMeal } from "./resolve";

// Live tests hit Claude + USDA. They run only when keys are present AND
// RUN_LIVE_NUTRITION_TESTS=1, so default `npm test` stays fast and deterministic.
const LIVE = !!process.env.ANTHROPIC_API_KEY && process.env.RUN_LIVE_NUTRITION_TESTS === "1";
const d = LIVE ? describe : describe.skip;

// Cache always misses in tests (no DB) → exercises Claude + USDA paths.
const stubSupabase = {
  from: () => ({ select: () => ({ in: () => Promise.resolve({ data: [] }) }) }),
} as unknown as SupabaseClient;

const settings = null;

d("meal analysis pipeline (live)", () => {
  it("case 1: parses four cooked items with nutrition + sources", async () => {
    const parsed = await parseMeal({
      text: "Lunch: 2 large eggs, 1 cup cooked basmati rice, 175 g cooked skinless chicken breast, and 1 cup mixed vegetables",
      mealType: "lunch", consumedAt: null, settings,
    });
    const meal = await resolveMeal(parsed, stubSupabase);
    expect(meal.items.length).toBe(4);
    // Cooked states retained on rice + chicken.
    const joined = meal.items.map((i) => `${i.name} ${i.preparationState ?? ""}`).join(" ").toLowerCase();
    expect(joined).toContain("cook");
    // Every item has numbers + a source.
    for (const it of meal.items) {
      expect(it.calories ?? 0).toBeGreaterThan(0);
      expect(it.sourceType).toBeTruthy();
    }
    expect(meal.totalCalories).toBeGreaterThan(400);
    expect(meal.totalProteinGrams).toBeGreaterThan(40);
  });

  it("case 2: recognizes the In-N-Out 4x4 brand/product", async () => {
    const parsed = await parseMeal({ text: "Dinner was a 4x4 from In-N-Out", mealType: "dinner", consumedAt: null, settings });
    const meal = await resolveMeal(parsed, stubSupabase);
    const burger = meal.items[0];
    expect((burger.brand ?? "").toLowerCase()).toContain("in-n-out");
    expect(burger.calories ?? 0).toBeGreaterThan(400);
  });

  it("case 3: retains a range and flags it for confirmation", async () => {
    const parsed = await parseMeal({ text: "I had somewhere between 175 and 285 grams of chicken breast", mealType: "lunch", consumedAt: null, settings });
    const item = parsed.items[0];
    expect(item.quantityMin).toBe(175);
    expect(item.quantityMax).toBe(285);
    expect(item.requiresConfirmation).toBe(true);
  });
});
