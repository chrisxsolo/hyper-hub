import { describe, it, expect } from "vitest";
import { hasSatiety, coerceRating, satietyLabel, hungerLabel, ratingColor } from "./satiety";

describe("hasSatiety", () => {
  it("is false when nothing is recorded", () => {
    expect(
      hasSatiety({
        satiety_score: null,
        hunger_after_2h: null,
        hunger_after_3h: null,
        cravings_after_meal: null,
        satiety_note: null,
      }),
    ).toBe(false);
  });

  it("treats a blank/whitespace note as no data", () => {
    expect(hasSatiety({ satiety_note: "   " })).toBe(false);
  });

  it("is true when any rating or a real note is present", () => {
    expect(hasSatiety({ satiety_score: 4 })).toBe(true);
    expect(hasSatiety({ cravings_after_meal: 1 })).toBe(true);
    expect(hasSatiety({ satiety_note: "kept me full till dinner" })).toBe(true);
  });
});

describe("coerceRating", () => {
  it("accepts integers 1–5", () => {
    expect(coerceRating(1)).toBe(1);
    expect(coerceRating(5)).toBe(5);
  });
  it("rejects out-of-range, non-integer, and non-number values", () => {
    expect(coerceRating(0)).toBe(null);
    expect(coerceRating(6)).toBe(null);
    expect(coerceRating(3.5)).toBe(null);
    expect(coerceRating("4")).toBe(null);
    expect(coerceRating(null)).toBe(null);
  });
});

describe("labels", () => {
  it("maps fullness across the scale", () => {
    expect(satietyLabel(1)).toBe("Still hungry");
    expect(satietyLabel(5)).toBe("Very full");
    expect(satietyLabel(0)).toBe("");
  });
  it("maps hunger/cravings intensity", () => {
    expect(hungerLabel(1)).toBe("None");
    expect(hungerLabel(5)).toBe("Intense");
  });
});

describe("ratingColor", () => {
  it("rewards high fullness but low hunger", () => {
    expect(ratingColor(5, true)).toBe("#34d399"); // very full → green
    expect(ratingColor(1, true)).toBe("#f87171"); // still hungry → red
    expect(ratingColor(1, false)).toBe("#34d399"); // not hungry later → green
    expect(ratingColor(5, false)).toBe("#f87171"); // starving later → red
  });
});
