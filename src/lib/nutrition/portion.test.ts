import { describe, it, expect } from "vitest";
import {
  isServingUnit,
  validateServings,
  MAX_NORMAL_SERVINGS,
  MAX_ABSOLUTE_SERVINGS,
} from "./portion";

describe("isServingUnit", () => {
  it("recognizes serving/portion units regardless of case/whitespace/plural", () => {
    for (const u of ["serving", "Servings", " portion ", "PORTIONS", "svg"]) {
      expect(isServingUnit(u)).toBe(true);
    }
  });

  it("rejects weight, volume, and count units", () => {
    for (const u of ["g", "oz", "lb", "ml", "fl oz", "item", "piece", "cup"]) {
      expect(isServingUnit(u)).toBe(false);
    }
  });

  it("handles null/empty", () => {
    expect(isServingUnit(null)).toBe(false);
    expect(isServingUnit("")).toBe(false);
    expect(isServingUnit(undefined)).toBe(false);
  });
});

describe("validateServings", () => {
  it("rejects zero / negative / NaN", () => {
    expect(validateServings(0).valid).toBe(false);
    expect(validateServings(-3).valid).toBe(false);
    expect(validateServings(Number.NaN).valid).toBe(false);
  });

  it("accepts normal amounts with no warning", () => {
    const r = validateServings(2);
    expect(r.valid).toBe(true);
    expect(r.warning).toBeUndefined();
    expect(r.blocked).toBeUndefined();
  });

  it("allows exactly the normal cap without warning", () => {
    const r = validateServings(MAX_NORMAL_SERVINGS); // 10
    expect(r.valid).toBe(true);
    expect(r.warning).toBeUndefined();
  });

  it("warns (but allows) just over the normal cap", () => {
    const r = validateServings(MAX_NORMAL_SERVINGS + 1); // 11
    expect(r.valid).toBe(true);
    expect(r.warning).toMatch(/unusually high/i);
    expect(r.blocked).toBeUndefined();
  });

  it("warns at the spec's example of 20 servings", () => {
    const r = validateServings(20);
    expect(r.valid).toBe(true);
    expect(r.warning).toContain("20");
  });

  it("allows exactly the absolute cap (warned)", () => {
    const r = validateServings(MAX_ABSOLUTE_SERVINGS); // 25
    expect(r.valid).toBe(true);
    expect(r.warning).toBeDefined();
  });

  it("blocks beyond the absolute cap", () => {
    for (const n of [MAX_ABSOLUTE_SERVINGS + 1, 100, 1000]) {
      const r = validateServings(n);
      expect(r.valid).toBe(false);
      expect(r.blocked).toBe(true);
      expect(r.message).toMatch(/too high/i);
    }
  });

  it("rounds the fractional count shown in the warning", () => {
    expect(validateServings(12.5).warning).toContain("12.5");
  });
});
