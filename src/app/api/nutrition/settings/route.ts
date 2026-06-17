import { type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthContext, jsonError, jsonOk, requestId } from "@/lib/nutrition/server";

const schema = z.object({
  calorie_target: z.number().int().min(0).max(20000).optional(),
  protein_target_g: z.number().int().min(0).max(2000).optional(),
  timezone: z.string().max(64).optional(),
  week_start: z.number().int().min(0).max(6).optional(),
  units: z.enum(["imperial", "metric"]).optional(),
  show_remaining: z.boolean().optional(),
  show_rolling_avg: z.boolean().optional(),
  ai_prefer_usda: z.boolean().optional(),
  ai_default_meal_type: z.string().max(20).optional(),
  rice_default: z.string().max(20).optional(),
  chicken_default: z.string().max(20).optional(),
  egg_size_default: z.string().max(20).optional(),
  default_milk: z.string().max(120).optional(),
});

export async function PATCH(request: NextRequest) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in as the owner.", rid);

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch (e) {
    return jsonError(400, "Invalid settings.", rid, { details: e instanceof Error ? e.message : undefined });
  }

  const { data: current } = await supabase.from("nutrition_settings").select("*").limit(1).maybeSingle();

  // Targets go through the history-recording function (don't rewrite old records).
  if (body.calorie_target != null || body.protein_target_g != null) {
    const cal = body.calorie_target ?? current?.calorie_target ?? 2200;
    const prot = body.protein_target_g ?? current?.protein_target_g ?? 160;
    const { error } = await supabase.rpc("nutrition_set_targets", {
      p_calorie_target: cal,
      p_protein_target: prot,
    });
    if (error) return jsonError(500, error.message, rid);
  }

  // Other preferences update the settings row directly.
  const prefs: Record<string, unknown> = {};
  for (const k of [
    "timezone", "week_start", "units", "show_remaining", "show_rolling_avg",
    "ai_prefer_usda", "ai_default_meal_type", "rice_default", "chicken_default",
    "egg_size_default", "default_milk",
  ] as const) {
    if (body[k] !== undefined) prefs[k] = body[k];
  }
  if (Object.keys(prefs).length) {
    if (current?.id) {
      const { error } = await supabase.from("nutrition_settings").update(prefs).eq("id", current.id);
      if (error) return jsonError(500, error.message, rid);
    } else {
      const { error } = await supabase.from("nutrition_settings").insert(prefs);
      if (error) return jsonError(500, error.message, rid);
    }
  }

  return jsonOk({ ok: true }, rid);
}
