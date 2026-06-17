// USDA FoodData Central client — the authoritative structured nutrition source.
// Best-effort and time-boxed: any failure (no key, timeout, no match) returns
// null, and the pipeline falls back to the cache or Claude's labeled estimate.
//
// Needs USDA_FDC_API_KEY (free: https://fdc.nal.usda.gov/api-key-signup.html).
// Falls back to the shared DEMO_KEY, which is heavily rate-limited.
//
// Server-only: imported solely by the analyze route handler.

const API_KEY = process.env.USDA_FDC_API_KEY || "DEMO_KEY";
const BASE = "https://api.nal.usda.gov/fdc/v1";

// Prefer generic, lab-analyzed data over branded/UPC rows for generic foods.
const GENERIC_DATA_TYPES = ["Foundation", "SR Legacy", "Survey (FNDDS)"];

export type UsdaFood = {
  fdcId: number;
  description: string;
  dataType: string;
  caloriesPer100g: number | null;
  proteinPer100g: number | null;
  sourceUrl: string;
};

type FdcNutrient = {
  nutrientNumber?: string;
  nutrientName?: string;
  unitName?: string;
  value?: number;
};

type FdcFood = {
  fdcId: number;
  description: string;
  dataType?: string;
  foodNutrients?: FdcNutrient[];
};

// Energy (kcal) is nutrient 208; Protein is 203. Foundation/SR/FNDDS report
// these per 100 g of the edible portion.
function extractPer100g(food: FdcFood): { kcal: number | null; protein: number | null } {
  let kcal: number | null = null;
  let protein: number | null = null;
  for (const n of food.foodNutrients ?? []) {
    const num = n.nutrientNumber;
    if (num === "208" && n.value != null && (n.unitName ?? "").toUpperCase().startsWith("KCAL")) {
      kcal = n.value;
    } else if (num === "208" && n.value != null && kcal == null) {
      kcal = n.value; // some rows omit unitName but 208 is always kcal
    } else if (num === "203" && n.value != null) {
      protein = n.value;
    }
  }
  return { kcal, protein };
}

export async function usdaLookup(query: string): Promise<UsdaFood | null> {
  if (!query.trim()) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  try {
    // Build the query manually: URLSearchParams encodes spaces as "+", which the
    // FDC gateway rejects for multi-word `dataType` values ("SR Legacy"). Use
    // encodeURIComponent so spaces become %20.
    const qs = [
      `query=${encodeURIComponent(query)}`,
      "pageSize=5",
      "requireAllWords=false",
      `dataType=${encodeURIComponent(GENERIC_DATA_TYPES.join(","))}`,
      `api_key=${encodeURIComponent(API_KEY)}`,
    ].join("&");

    // The FDC gateway intermittently 400s on bursty/concurrent traffic. Retry
    // once before giving up (still well within the abort timeout).
    let data: { foods?: FdcFood[] } | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(`${BASE}/foods/search?${qs}`, { signal: controller.signal });
      if (res.ok) {
        data = (await res.json()) as { foods?: FdcFood[] };
        break;
      }
      if (attempt === 0) await new Promise((r) => setTimeout(r, 300));
    }
    const foods = data?.foods ?? [];
    if (!foods.length) return null;

    // Pick the first match that actually has both calories and protein.
    for (const food of foods) {
      const { kcal, protein } = extractPer100g(food);
      if (kcal != null && protein != null) {
        return {
          fdcId: food.fdcId,
          description: food.description,
          dataType: food.dataType ?? "USDA",
          caloriesPer100g: kcal,
          proteinPer100g: protein,
          sourceUrl: `https://fdc.nal.usda.gov/food-details/${food.fdcId}/nutrients`,
        };
      }
    }
    return null;
  } catch {
    return null; // timeout, network, rate-limit — degrade gracefully
  } finally {
    clearTimeout(timeout);
  }
}
