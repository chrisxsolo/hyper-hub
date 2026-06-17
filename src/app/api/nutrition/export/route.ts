import { NextResponse } from "next/server";
import { getAuthContext, jsonError, requestId } from "@/lib/nutrition/server";

// Full data export as a downloadable JSON file (owner only).
export async function GET() {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in as the owner to export.", rid);

  const [meals, items, foods, templates, aliases, settings, targets] = await Promise.all([
    supabase.from("nutrition_meals").select("*").is("deleted_at", null).order("consumed_at"),
    supabase.from("nutrition_meal_items").select("*").order("position"),
    supabase.from("nutrition_foods").select("*").order("name"),
    supabase.from("nutrition_meal_templates").select("*").order("name"),
    supabase.from("nutrition_aliases").select("*"),
    supabase.from("nutrition_settings").select("*").limit(1).maybeSingle(),
    supabase.from("nutrition_target_history").select("*").order("effective_on"),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    settings: settings.data ?? null,
    targetHistory: targets.data ?? [],
    meals: meals.data ?? [],
    mealItems: items.data ?? [],
    savedFoods: foods.data ?? [],
    savedMeals: templates.data ?? [],
    aliases: aliases.data ?? [],
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="nutrition-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "x-request-id": rid,
    },
  });
}
