import { getViewer } from "@/lib/supabase/server";
import { todayInTz } from "@/lib/nutrition/db";
import { withMetrics, rankBy } from "@/lib/products/rankings";
import type { ProductOverview } from "@/lib/products/types";
import ToolsClient from "./ToolsClient";

// Personalized Tools hub. The tools I actively use (vs. read). Tiles show a
// live summary and open the full tool. Summaries are best-effort — they fall
// back to a static subtitle when data is empty or a query fails.
const OWNER_EMAIL = "chrissolorzano118@gmail.com";

export const metadata = {
  title: "Personalized Tools — Hyper Hub",
  description: "Calorie tracker, grocery list, and personal metrics.",
};

export default async function ToolsPage() {
  const { supabase, email } = await getViewer();
  const canEdit = email === OWNER_EMAIL;

  // The three tile summaries are independent, so fetch them concurrently rather
  // than one-after-another — the page is only as slow as the slowest summary.
  // Each is best-effort and falls back to a static subtitle on empty/error.

  // ── Calorie tracker summary (public-read data) ──
  const calorieP = (async () => {
    try {
      const { data: settings } = await supabase
        .from("nutrition_settings")
        .select("calorie_target, protein_target_g, timezone")
        .limit(1)
        .maybeSingle();
      const today = todayInTz(settings?.timezone ?? null);
      const { data: meals } = await supabase
        .from("nutrition_meals")
        .select("total_calories, total_protein_g")
        .eq("eaten_on", today)
        .is("deleted_at", null);
      if (meals && meals.length > 0) {
        const kcal = Math.round(meals.reduce((s, m) => s + (m.total_calories ?? 0), 0));
        const protein = Math.round(meals.reduce((s, m) => s + (m.total_protein_g ?? 0), 0));
        const target = settings?.calorie_target ?? null;
        const left = target != null ? Math.max(0, target - kcal) : null;
        return (
          `Today: ${kcal.toLocaleString()} kcal · ${protein}g protein` +
          (left != null ? ` · ${left.toLocaleString()} left` : "")
        );
      }
      return "No meals logged today — tap to start";
    } catch {
      return "Today's calories, protein, and remaining targets";
    }
  })();

  // ── Grocery summary (private — owner only) ──
  const groceryP = (async () => {
    if (!canEdit) return "Your running grocery list";
    try {
      const { count } = await supabase
        .from("grocery_items")
        .select("id", { count: "exact", head: true })
        .eq("checked", false);
      if (count != null) {
        return count > 0 ? `${count} item${count === 1 ? "" : "s"} remaining` : "All caught up — list is clear";
      }
      return "Your running grocery list";
    } catch {
      return "Your running grocery list";
    }
  })();

  // ── Products summary (private — owner only) ──
  const productsP = (async () => {
    if (!canEdit) return "A personal Costco product & price database";
    try {
      const { count } = await supabase
        .from("costco_products")
        .select("id", { count: "exact", head: true });
      if (count != null) {
        return count > 0
          ? `${count} product${count === 1 ? "" : "s"} tracked — scan to add more`
          : "Scan a product or price tag to start";
      }
      return "Scan products to build your price database";
    } catch {
      return "Scan products to build your price database";
    }
  })();

  // ── ROI rankings summary (private — owner only) ──
  // Reuses the same value-metric math as the rankings page; we skip image
  // signing here since the one-line summary only needs name + protein/$.
  const roiP = (async () => {
    if (!canEdit) return "Rank your foods by nutrition value for the money";
    try {
      const { data } = await supabase.from("costco_products_overview").select("*");
      const rows = (data ?? []) as unknown as ProductOverview[];
      const top = rankBy(withMetrics(rows), "proteinPerDollar")[0];
      if (top?.metrics.proteinPerDollar != null) {
        const name = top.product.name.length > 24 ? `${top.product.name.slice(0, 23)}…` : top.product.name;
        return `Best protein value: ${name} · ${top.metrics.proteinPerDollar.toFixed(1)} g/$`;
      }
      return "Scan prices + nutrition to rank your best-value foods";
    } catch {
      return "Rank your foods by nutrition value for the money";
    }
  })();

  // ── Metrics summary (public-read data) ──
  const metricsP = (async () => {
    try {
      const { data: w } = await supabase
        .from("health_weight")
        .select("weight_lbs, measured_on")
        .order("measured_on", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (w?.weight_lbs != null) {
        return `Latest weight ${Number(w.weight_lbs).toFixed(1)} lbs · activity, sleep & trends`;
      }
      return "Weight, activity, nutrition, sleep, and health trends";
    } catch {
      return "Weight, activity, nutrition, sleep, and health trends";
    }
  })();

  const [calorieSummary, grocerySummary, productsSummary, roiSummary, metricsSummary] =
    await Promise.all([calorieP, groceryP, productsP, roiP, metricsP]);

  return (
    <ToolsClient
      calorieSummary={calorieSummary}
      grocerySummary={grocerySummary}
      productsSummary={productsSummary}
      roiSummary={roiSummary}
      metricsSummary={metricsSummary}
    />
  );
}
