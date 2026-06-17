// Shared nutrition-tracker types + the Zod schema Claude must conform to.
// Safe to import from both server and client (no server-only deps here).

import { z } from "zod";

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack", "other"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

// Source priority, highest-trust first. `personal` = a food the user has already
// confirmed (the cache); `usda` = USDA FoodData Central; `ai_estimate` = Claude's
// own best guess, used only as a labeled fallback.
export const SOURCE_TYPES = [
  "personal",
  "official_restaurant",
  "usda",
  "manufacturer",
  "nutrition_database",
  "ai_estimate",
  "manual",
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const NUTRITION_BASES = ["per_item", "per_100g", "per_serving"] as const;
export type NutritionBasis = (typeof NUTRITION_BASES)[number];

// ── What Claude returns (validated server-side via forced tool use) ────────────
export const claudeItemSchema = z.object({
  originalPhrase: z.string(),
  normalizedName: z.string(),
  brand: z.string().nullable(),
  quantity: z.number().nullable(),
  quantityMin: z.number().nullable(),
  quantityMax: z.number().nullable(),
  unit: z.string(),
  preparationState: z.string().nullable(),
  // Best estimate of the TOTAL grams for the stated portion — lets the server
  // scale an authoritative per-100g figure even for volumetric units ("1 cup").
  gramsEstimate: z.number().nullable(),
  // A clean, generic search term for USDA FoodData Central. Null for branded /
  // restaurant items where a generic database lookup would be misleading.
  usdaQuery: z.string().nullable(),
  isRestaurant: z.boolean(),
  calories: z.number().nullable(),
  proteinGrams: z.number().nullable(),
  nutritionBasis: z.enum(NUTRITION_BASES),
  sourceType: z.enum(SOURCE_TYPES),
  sourceName: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  confidence: z.number(),
  assumptions: z.array(z.string()),
  requiresConfirmation: z.boolean(),
});
export type ClaudeItem = z.infer<typeof claudeItemSchema>;

export const claudeMealSchema = z.object({
  mealType: z.enum(MEAL_TYPES),
  consumedAt: z.string().nullable(),
  originalText: z.string(),
  items: z.array(claudeItemSchema),
  assumptions: z.array(z.string()),
  confidence: z.number(),
});
export type ClaudeMeal = z.infer<typeof claudeMealSchema>;

// ── Server → client proposed meal (post-enrichment, fully editable) ───────────
export type ProposedItem = {
  originalPhrase: string;
  name: string;
  brand: string | null;
  quantity: number | null;
  quantityMin: number | null;
  quantityMax: number | null;
  unit: string;
  preparationState: string | null;
  gramsEstimate: number | null;
  caloriesPer100g: number | null;
  proteinPer100g: number | null;
  calories: number | null;
  proteinGrams: number | null;
  // Nutrition per 1 of `unit` × `quantity`, so the client can recompute
  // mathematically when the quantity is edited.
  perUnitCalories: number | null;
  perUnitProtein: number | null;
  nutritionBasis: NutritionBasis;
  sourceType: SourceType;
  sourceName: string | null;
  sourceUrl: string | null;
  sourceRetrievedAt: string | null;
  confidence: number;
  assumptions: string[];
  requiresConfirmation: boolean;
  verified: boolean;
};

export type ProposedMeal = {
  mealType: MealType;
  consumedAt: string | null;
  originalText: string;
  items: ProposedItem[];
  totalCalories: number;
  totalProteinGrams: number;
  assumptions: string[];
  confidence: number;
};

export type NutritionSettings = {
  id: string;
  calorie_target: number;
  protein_target_g: number;
  rice_default: string;
  chicken_default: string;
  egg_size_default: string;
  default_milk: string;
  timezone: string;
  week_start: number; // 0 = Sunday … 6 = Saturday
  units: "imperial" | "metric";
  show_remaining: boolean;
  show_rolling_avg: boolean;
  ai_prefer_usda: boolean;
  ai_default_meal_type: string;
};

export type TargetHistoryRow = {
  id: string;
  effective_on: string;
  calorie_target: number;
  protein_target_g: number;
};

export type MealTemplate = {
  id: string;
  name: string;
  meal_type: MealType;
  items: ProposedItem[];
  total_calories: number;
  total_protein_g: number;
};

export type AliasRow = {
  id: string;
  phrase: string;
  template_id: string | null;
  note: string | null;
};

export type SavedFood = {
  id: string;
  name: string;
  brand: string | null;
  preparation_state: string | null;
  basis: string;
  calories_per_100g: number | null;
  protein_per_100g: number | null;
  serving_calories: number | null;
  serving_protein_g: number | null;
  serving_label: string | null;
  source_type: SourceType;
  verified: boolean;
  times_logged: number;
};

// Confidence bucket used for the UI badge.
export function confidenceLevel(c: number): "low" | "medium" | "high" {
  if (c >= 0.75) return "high";
  if (c >= 0.45) return "medium";
  return "low";
}

export const SOURCE_LABELS: Record<SourceType, string> = {
  personal: "Your verified food",
  official_restaurant: "Official restaurant",
  usda: "USDA FoodData Central",
  manufacturer: "Manufacturer",
  nutrition_database: "Nutrition database",
  ai_estimate: "AI estimate",
  manual: "Manually entered",
};
