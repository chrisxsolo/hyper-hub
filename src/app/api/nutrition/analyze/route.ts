import { type NextRequest } from "next/server";
import { z } from "zod";
import { parseMeal, MissingApiKeyError } from "@/lib/nutrition/claude";
import { resolveMeal } from "@/lib/nutrition/resolve";
import { MEAL_TYPES, type NutritionSettings, type ProposedItem, type ProposedMeal } from "@/lib/nutrition/types";
import { round } from "@/lib/nutrition/units";
import { getAuthContext, jsonError, jsonOk, rateLimit, requestId } from "@/lib/nutrition/server";

const bodySchema = z.object({
  text: z.string().min(1).max(4000),
  mealType: z.enum(MEAL_TYPES).default("other"),
  consumedAt: z.string().nullable().optional(),
  // When true, skip the alias/template fast-path (used by per-item re-lookup).
  forceFresh: z.boolean().optional(),
});

// "my usual lunch" → a saved meal template, with no external lookup.
async function aliasMatch(
  supabase: Awaited<ReturnType<typeof getAuthContext>>["supabase"],
  text: string,
): Promise<ProposedMeal | null> {
  const norm = text.toLowerCase().trim();
  const { data: aliases } = await supabase
    .from("nutrition_aliases")
    .select("phrase, template_id");
  if (!aliases?.length) return null;
  const hit = aliases.find((a: { phrase: string; template_id: string | null }) => {
    const p = a.phrase.toLowerCase().trim();
    return a.template_id && (norm === p || norm.includes(p));
  });
  if (!hit?.template_id) return null;

  const { data: tpl } = await supabase
    .from("nutrition_meal_templates")
    .select("*")
    .eq("id", hit.template_id)
    .maybeSingle();
  if (!tpl) return null;

  const items = (tpl.items as ProposedItem[]) ?? [];
  return {
    mealType: tpl.meal_type,
    consumedAt: null,
    originalText: text,
    items: items.map((it) => ({ ...it, sourceType: "personal", verified: true })),
    totalCalories: round(items.reduce((s, it) => s + (it.calories ?? 0), 0), 0),
    totalProteinGrams: round(items.reduce((s, it) => s + (it.proteinGrams ?? 0), 0), 1),
    assumptions: [`Loaded from your saved meal "${tpl.name}".`],
    confidence: 0.95,
  };
}

export async function POST(request: NextRequest) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in as the owner to analyze meals.", rid);

  if (!rateLimit("analyze", 20, 60_000)) {
    return jsonError(429, "Too many analyses in a short window — wait a moment and retry.", rid);
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return jsonError(400, "Invalid request.", rid);
  }

  // Fast path: saved-meal alias (no Claude/USDA call).
  if (!body.forceFresh) {
    try {
      const fromAlias = await aliasMatch(supabase, body.text);
      if (fromAlias) return jsonOk({ meal: fromAlias, source: "alias" }, rid);
    } catch {
      /* fall through to AI parse */
    }
  }

  const { data: settingsRow } = await supabase
    .from("nutrition_settings")
    .select("*")
    .limit(1)
    .maybeSingle();
  const settings = (settingsRow as NutritionSettings | null) ?? null;

  try {
    const claudeMeal = await parseMeal({
      text: body.text,
      mealType: body.mealType,
      consumedAt: body.consumedAt ?? null,
      settings,
    });
    const proposal = await resolveMeal(claudeMeal, supabase);
    return jsonOk({ meal: proposal }, rid);
  } catch (err) {
    if (err instanceof MissingApiKeyError) return jsonError(503, err.message, rid);
    const message = err instanceof Error ? err.message : "Analysis failed.";
    return jsonError(502, `We couldn't fully analyze that meal. ${message}`, rid, { recoverable: true });
  }
}
