import { type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthContext, jsonError, jsonOk, requestId } from "@/lib/nutrition/server";

// PATCH — record (or clear) satiety / behavior ratings for a logged meal (spec
// §11). These columns live on nutrition_meals and don't affect totals, so we
// write them directly (RLS "owner write meals" covers the owner) rather than
// going through the totals-recomputing nutrition_update_meal RPC.

const idSchema = z.string().uuid();
const rating = z.number().int().min(1).max(5).nullable();
const bodySchema = z.object({
  satietyScore: rating,
  hungerAfter2h: rating,
  hungerAfter3h: rating,
  cravingsAfterMeal: rating,
  note: z.string().trim().max(500).nullable(),
});

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in as the owner to rate meals.", rid);

  const { id } = await ctx.params;
  if (!idSchema.safeParse(id).success) return jsonError(400, "Invalid meal id.", rid);

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch (e) {
    return jsonError(400, "Invalid satiety payload.", rid, {
      details: e instanceof Error ? e.message : undefined,
    });
  }

  const { error } = await supabase
    .from("nutrition_meals")
    .update({
      satiety_score: body.satietyScore,
      hunger_after_2h: body.hungerAfter2h,
      hunger_after_3h: body.hungerAfter3h,
      cravings_after_meal: body.cravingsAfterMeal,
      satiety_note: body.note && body.note.length > 0 ? body.note : null,
    })
    .eq("id", id)
    .is("deleted_at", null);
  if (error) return jsonError(500, error.message, rid);

  return jsonOk({ id }, rid);
}
