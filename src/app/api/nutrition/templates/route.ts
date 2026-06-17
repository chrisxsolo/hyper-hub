import { type NextRequest } from "next/server";
import { z } from "zod";
import { MEAL_TYPES } from "@/lib/nutrition/types";
import { round } from "@/lib/nutrition/units";
import { getAuthContext, jsonError, jsonOk, requestId } from "@/lib/nutrition/server";

// Items are stored as ProposedItem-shaped JSON so a template applies directly.
const schema = z.object({
  name: z.string().min(1).max(120),
  meal_type: z.enum(MEAL_TYPES).default("other"),
  items: z.array(z.record(z.string(), z.unknown())).min(1).max(40),
});

export async function POST(request: NextRequest) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in as the owner.", rid);

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch (e) {
    return jsonError(400, "Invalid template.", rid, { details: e instanceof Error ? e.message : undefined });
  }

  const cal = round(body.items.reduce((s, it) => s + (Number(it.calories) || 0), 0), 0);
  const prot = round(body.items.reduce((s, it) => s + (Number(it.proteinGrams) || 0), 0), 1);

  const { data, error } = await supabase
    .from("nutrition_meal_templates")
    .insert({
      name: body.name,
      meal_type: body.meal_type,
      items: body.items,
      total_calories: cal,
      total_protein_g: prot,
    })
    .select("id")
    .single();
  if (error) return jsonError(500, error.message, rid);
  return jsonOk({ id: data.id }, rid, 201);
}
