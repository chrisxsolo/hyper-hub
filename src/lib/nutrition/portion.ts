// Portion-selection helpers for logging a food. Two concerns live here:
//
//  1. The "how much did you eat?" modes — whole item / half / custom fraction /
//     grams / servings — and the fraction quick-picks behind them.
//  2. The guard that stops an absurd serving count (20, 100, 1000 …) from
//     silently multiplying a meal's nutrition.
//
// Pure + dependency-light so it's reusable on the client (serving sheet, review
// table) and the server (log-product route, meal schema). No I/O.

import { normalizeUnit } from "./units";
import { SERVING_UNITS } from "@/lib/products/serving";

/** Above this many servings we ask the user to confirm — unusual but possible. */
export const MAX_NORMAL_SERVINGS = 10;
/** Above this many servings we refuse outright — almost certainly a typo. */
export const MAX_ABSOLUTE_SERVINGS = 25;

/** Quick-pick fractions for the "custom fraction of the whole item" mode. */
export const FRACTION_PRESETS = [0.25, 0.5, 0.75, 1, 1.25] as const;

/** True when `unit` means "servings/portions" (not grams, oz, items, …). */
export function isServingUnit(unit: string | null | undefined): boolean {
  if (!unit) return false;
  return SERVING_UNITS.has(normalizeUnit(unit));
}

export type ServingValidation = {
  valid: boolean; // false → block the log
  blocked?: boolean; // true only when over the absolute cap (vs. a zero/NaN reject)
  warning?: string; // set when unusually high but allowed (UI should make the user confirm)
  message?: string; // set when invalid (why it's blocked)
};

/**
 * Guard a raw serving count entered by the user:
 *  - ≤ 0 / NaN               → invalid (nothing to log)
 *  - > MAX_ABSOLUTE_SERVINGS → invalid, hard block
 *  - > MAX_NORMAL_SERVINGS   → valid but warn (UI should require an explicit confirm)
 *  - otherwise               → valid
 */
export function validateServings(servings: number): ServingValidation {
  if (!Number.isFinite(servings) || servings <= 0) {
    return { valid: false, message: "Enter a serving amount greater than zero." };
  }
  if (servings > MAX_ABSOLUTE_SERVINGS) {
    return {
      valid: false,
      blocked: true,
      message:
        "Serving amount is too high. Please use Whole item, a fraction, or a realistic serving amount.",
    };
  }
  if (servings > MAX_NORMAL_SERVINGS) {
    const shown = Number.isInteger(servings) ? servings : Math.round(servings * 100) / 100;
    return {
      valid: true,
      warning: `This looks unusually high. Did you really eat ${shown} servings?`,
    };
  }
  return { valid: true };
}
