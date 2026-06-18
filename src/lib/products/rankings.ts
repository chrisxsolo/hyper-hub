// Rank the Costco product database by nutrition-vs-price ROI (spec §9, §10, §24).
// Pure functions over the overview rows — reuses computeValueMetrics and invents
// nothing: a product only appears in a metric's ranking when that metric is
// non-null for it. No I/O here, so this is safe to import from server and client.

import { computeValueMetrics, type ValueInputs } from "./analytics";
import type { ProductOverview, ProductValueMetrics } from "./types";

// The ROI metrics we can rank by today, each derived from a product's latest
// scanned price + current nutrition version. (Fiber-per-dollar and satiety are
// future additions once those inputs are surfaced.)
export const RANK_METRICS = [
  "proteinPerDollar",
  "proteinPer100Cal",
  "costPerServing",
  "caloriesPerDollar",
] as const;
export type RankMetric = (typeof RANK_METRICS)[number];

// Whether a larger value ranks better. Protein-per-dollar, lean-protein density,
// and calories-per-dollar sort high→low; cost-per-serving sorts low→high.
export const HIGHER_IS_BETTER: Record<RankMetric, boolean> = {
  proteinPerDollar: true,
  proteinPer100Cal: true,
  caloriesPerDollar: true,
  costPerServing: false,
};

// Protein-per-100-calories is serving- and price-independent (just protein ÷
// calories), so it ranks any product that has a nutrition version. Every other
// metric needs a price too. Drives honest "why can't this rank?" messaging.
export function metricNeedsPrice(metric: RankMetric): boolean {
  return metric !== "proteinPer100Cal";
}

export type RankedProduct = {
  product: ProductOverview;
  metrics: ProductValueMetrics;
};

// Map an overview row to the flat inputs computeValueMetrics expects.
export function valueInputsFromOverview(p: ProductOverview): ValueInputs {
  return {
    totalPrice: p.last_total_price,
    totalWeight: p.total_weight,
    weightUnit: p.weight_unit,
    packageCount: p.package_count,
    calories: p.n_calories,
    proteinG: p.n_protein_g,
    servingSizeValue: p.n_serving_value,
    servingSizeUnit: p.n_serving_unit,
    servingsPerContainer: p.n_servings_per_container,
  };
}

// Attach derived value metrics to every product (input order preserved).
export function withMetrics(products: ProductOverview[]): RankedProduct[] {
  return products.map((product) => ({
    product,
    metrics: computeValueMetrics(valueInputsFromOverview(product)),
  }));
}

// Products that have a value for `metric`, best-first. Ties break by name so the
// order is stable (and tests deterministic).
export function rankBy(items: RankedProduct[], metric: RankMetric): RankedProduct[] {
  const higher = HIGHER_IS_BETTER[metric];
  return items
    .filter((it) => it.metrics[metric] != null)
    .sort((a, b) => {
      const diff = (b.metrics[metric] as number) - (a.metrics[metric] as number);
      const ordered = higher ? diff : -diff;
      if (ordered !== 0) return ordered;
      return a.product.name.localeCompare(b.product.name);
    });
}

// Why a product can't be ranked yet — drives the "needs data" prompts. Every ROI
// metric needs both a price and a current nutrition version to resolve.
export type DataGap = { needsPrice: boolean; needsNutrition: boolean };

export function dataGap(p: ProductOverview): DataGap {
  return {
    needsPrice: p.last_total_price == null,
    needsNutrition: !p.has_nutrition || p.n_calories == null,
  };
}

// Split a metric's products into the ranked list and the "can't rank yet" rest.
export function partitionForMetric(
  items: RankedProduct[],
  metric: RankMetric,
): { ranked: RankedProduct[]; unranked: RankedProduct[] } {
  const ranked = rankBy(items, metric);
  const rankedIds = new Set(ranked.map((r) => r.product.id));
  const unranked = items.filter((it) => !rankedIds.has(it.product.id));
  return { ranked, unranked };
}
