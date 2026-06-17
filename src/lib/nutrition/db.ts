// Client-safe row types for the nutrition_* tables + small date helpers.
// (No server-only imports here — used by the dashboard client.)

import type { MealType, NutritionBasis, ProposedItem, SourceType } from "./types";

export type DbMeal = {
  id: string;
  meal_type: MealType;
  consumed_at: string;
  eaten_on: string;
  original_text: string;
  total_calories: number;
  total_protein_g: number;
  confidence: number | null;
  assumptions: string[] | null;
  note: string | null;
  deleted_at: string | null;
  client_token: string | null;
  created_at: string;
};

export type DbItem = {
  id: string;
  meal_id: string;
  position: number;
  original_phrase: string | null;
  name: string;
  brand: string | null;
  quantity: number | null;
  quantity_min: number | null;
  quantity_max: number | null;
  unit: string;
  preparation_state: string | null;
  calories: number | null;
  protein_g: number | null;
  grams: number | null;
  calories_per_100g: number | null;
  protein_per_100g: number | null;
  nutrition_basis: NutritionBasis;
  source_type: SourceType;
  source_name: string | null;
  source_url: string | null;
  source_retrieved_at: string | null;
  confidence: number | null;
  assumptions: string[] | null;
  verified: boolean;
  created_at: string;
};

export type MealWithItems = DbMeal & { items: DbItem[] };

// ── Mappers between the editable ProposedItem shape and DB rows ────────────────
export function dbItemToProposed(it: DbItem): ProposedItem {
  const qty = it.quantity;
  return {
    originalPhrase: it.original_phrase ?? "",
    name: it.name,
    brand: it.brand,
    quantity: it.quantity,
    quantityMin: it.quantity_min,
    quantityMax: it.quantity_max,
    unit: it.unit,
    preparationState: it.preparation_state,
    gramsEstimate: it.grams,
    caloriesPer100g: it.calories_per_100g,
    proteinPer100g: it.protein_per_100g,
    calories: it.calories,
    proteinGrams: it.protein_g,
    perUnitCalories: it.calories != null && qty ? it.calories / qty : null,
    perUnitProtein: it.protein_g != null && qty ? it.protein_g / qty : null,
    nutritionBasis: it.nutrition_basis,
    sourceType: it.source_type,
    sourceName: it.source_name,
    sourceUrl: it.source_url,
    sourceRetrievedAt: it.source_retrieved_at,
    confidence: it.confidence ?? 0.7,
    assumptions: it.assumptions ?? [],
    requiresConfirmation: false,
    verified: it.verified,
  };
}

export function proposedItemToRow(it: ProposedItem, position: number) {
  return {
    position,
    original_phrase: it.originalPhrase || null,
    name: it.name,
    brand: it.brand,
    quantity: it.quantity,
    quantity_min: it.quantityMin,
    quantity_max: it.quantityMax,
    unit: it.unit,
    preparation_state: it.preparationState,
    calories: it.calories,
    protein_g: it.proteinGrams,
    grams: it.gramsEstimate,
    calories_per_100g: it.caloriesPer100g,
    protein_per_100g: it.proteinPer100g,
    nutrition_basis: it.nutritionBasis,
    source_type: it.sourceType,
    source_name: it.sourceName,
    source_url: it.sourceUrl,
    source_retrieved_at: it.sourceRetrievedAt,
    confidence: it.confidence,
    assumptions: it.assumptions,
    verified: it.verified,
  };
}

// ── Local-time date helpers (the dashboard's "today" is the user's local day) ──
export function localISODate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// "Today" in a specific IANA timezone (falls back to the browser's local day).
export function todayInTz(tz?: string | null): string {
  if (!tz) return localISODate();
  try {
    // en-CA formats as YYYY-MM-DD.
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return localISODate();
  }
}

export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return localISODate(dt);
}

export function fmtDayLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function fmtTime(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export const MEAL_TYPE_META: Record<MealType, { label: string; emoji: string; color: string }> = {
  breakfast: { label: "Breakfast", emoji: "🍳", color: "#fbbf24" },
  lunch: { label: "Lunch", emoji: "🥗", color: "#34d399" },
  dinner: { label: "Dinner", emoji: "🍽️", color: "#60a5fa" },
  snack: { label: "Snack", emoji: "🍎", color: "#f472b6" },
  other: { label: "Other", emoji: "🍴", color: "#94a3b8" },
};
