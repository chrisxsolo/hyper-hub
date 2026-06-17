import { describe, it, expect } from "vitest";
import {
  scaleByGrams, scaleByServing, mealTotals, aggregateByDay, averageOverLoggedDays, findAliasPhrase,
} from "./calc";
import { round } from "./units";

describe("nutrition scaling", () => {
  it("scales per-100g figures by grams (calories)", () => {
    // 165 kcal/100g chicken × 175 g = ~289 kcal
    expect(round(scaleByGrams(165, 175))).toBe(289);
  });
  it("scales per-100g figures by grams (protein)", () => {
    expect(round(scaleByGrams(31, 175), 1)).toBe(54.3);
  });
  it("scales per-serving figures by quantity", () => {
    expect(scaleByServing(670, 1)).toBe(670);
    expect(scaleByServing(78, 2)).toBe(156); // 2 large eggs ≈ 78 kcal each
  });
});

describe("meal totals", () => {
  it("sums item macros with display rounding", () => {
    const totals = mealTotals([
      { calories: 156, proteinGrams: 12.6 },
      { calories: 205, proteinGrams: 4.3 },
      { calories: 289, proteinGrams: 54.3 },
      { calories: 40, proteinGrams: 2.0 },
    ]);
    expect(totals.calories).toBe(690);
    expect(totals.proteinGrams).toBe(73.2);
  });
  it("treats null macros as zero", () => {
    expect(mealTotals([{ calories: null, proteinGrams: null }, { calories: 100, proteinGrams: 10 }]))
      .toEqual({ calories: 100, proteinGrams: 10 });
  });
});

describe("date-range aggregation", () => {
  const meals = [
    { eaten_on: "2026-06-15", total_calories: 2100, total_protein_g: 128 },
    { eaten_on: "2026-06-16", total_calories: 1000, total_protein_g: 70 },
    { eaten_on: "2026-06-16", total_calories: 850, total_protein_g: 70 },
    { eaten_on: "2026-06-17", total_calories: 1360, total_protein_g: 101 },
  ];
  it("groups multiple meals per day", () => {
    const byDay = aggregateByDay(meals);
    expect(byDay.get("2026-06-16")).toEqual({ cal: 1850, prot: 140 });
    expect(byDay.get("2026-06-15")?.cal).toBe(2100);
    expect(byDay.size).toBe(3);
  });
});

describe("missing-day average behavior", () => {
  it("averages over logged days only, ignoring zero/empty days", () => {
    // 7-day window with only 3 logged days.
    expect(averageOverLoggedDays([2100, 0, 0, 1850, 0, 1360, 0])).toBe(1770);
  });
  it("returns 0 (not NaN) when nothing is logged", () => {
    expect(averageOverLoggedDays([0, 0, 0])).toBe(0);
    expect(averageOverLoggedDays([])).toBe(0);
  });
});

describe("alias matching (saved-meal fast path)", () => {
  const aliases = [
    { phrase: "my usual lunch", template_id: "tpl-1" },
    { phrase: "post workout shake", template_id: "tpl-2" },
    { phrase: "broken", template_id: null },
  ];
  it("matches an exact phrase", () => {
    expect(findAliasPhrase(aliases, "My Usual Lunch")?.template_id).toBe("tpl-1");
  });
  it("matches a phrase contained in the text", () => {
    expect(findAliasPhrase(aliases, "I had my usual lunch today")?.template_id).toBe("tpl-1");
  });
  it("ignores aliases without a template", () => {
    expect(findAliasPhrase(aliases, "broken")).toBeNull();
  });
  it("returns null when nothing matches", () => {
    expect(findAliasPhrase(aliases, "two eggs and rice")).toBeNull();
  });
});
