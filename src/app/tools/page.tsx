import { createClient } from "@/lib/supabase/server";
import { todayInTz } from "@/lib/nutrition/db";
import ToolsClient from "./ToolsClient";

// Personalized Tools hub. The tools I actively use (vs. read). Tiles show a
// live summary and open the full tool. Summaries are best-effort — they fall
// back to a static subtitle when data is empty or a query fails.
const OWNER_EMAIL = "chrissolorzano118@gmail.com";

export const metadata = {
  title: "Personalized Tools — Hyper Hub",
  description: "Calorie tracker, Costco grocery list, and personal metrics.",
};

export default async function ToolsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const canEdit = user?.email === OWNER_EMAIL;

  // ── Calorie tracker summary (public-read data) ──
  let calorieSummary = "Today's calories, protein, and remaining targets";
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
      calorieSummary =
        `Today: ${kcal.toLocaleString()} kcal · ${protein}g protein` +
        (left != null ? ` · ${left.toLocaleString()} left` : "");
    } else {
      calorieSummary = "No meals logged today — tap to start";
    }
  } catch {
    /* keep default */
  }

  // ── Grocery summary (private — owner only) ──
  let grocerySummary = "Your running Costco shopping list";
  if (canEdit) {
    try {
      const { count } = await supabase
        .from("grocery_items")
        .select("id", { count: "exact", head: true })
        .eq("checked", false);
      if (count != null) {
        grocerySummary = count > 0 ? `${count} item${count === 1 ? "" : "s"} remaining` : "All caught up — list is clear";
      }
    } catch {
      /* keep default */
    }
  }

  // ── Metrics summary (public-read data) ──
  let metricsSummary = "Weight, activity, nutrition, sleep, and health trends";
  try {
    const { data: w } = await supabase
      .from("health_weight")
      .select("weight_lbs, measured_on")
      .order("measured_on", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (w?.weight_lbs != null) {
      metricsSummary = `Latest weight ${Number(w.weight_lbs).toFixed(1)} lbs · activity, sleep & trends`;
    }
  } catch {
    /* keep default */
  }

  return (
    <ToolsClient
      calorieSummary={calorieSummary}
      grocerySummary={grocerySummary}
      metricsSummary={metricsSummary}
    />
  );
}
