import { type NextRequest } from "next/server";
import { z } from "zod";
import { updateMealSchema } from "@/lib/nutrition/schemas";
import { getAuthContext, jsonError, jsonOk, requestId } from "@/lib/nutrition/server";

const idSchema = z.string().uuid();

// PATCH — edit meal fields and/or replace items; totals recomputed server-side.
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in as the owner to edit meals.", rid);

  const { id } = await ctx.params;
  if (!idSchema.safeParse(id).success) return jsonError(400, "Invalid meal id.", rid);

  let body: ReturnType<typeof updateMealSchema.parse>;
  try {
    body = updateMealSchema.parse(await request.json());
  } catch (e) {
    return jsonError(400, "Invalid update payload.", rid, {
      details: e instanceof Error ? e.message : undefined,
    });
  }

  const { error } = await supabase.rpc("nutrition_update_meal", {
    p_meal_id: id,
    p_patch: body.patch,
    p_items: body.items ?? null,
  });
  if (error) return jsonError(500, error.message, rid);
  return jsonOk({ id }, rid);
}

// DELETE — soft delete (restorable for a while via /restore).
export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in as the owner to delete meals.", rid);

  const { id } = await ctx.params;
  if (!idSchema.safeParse(id).success) return jsonError(400, "Invalid meal id.", rid);

  const { error } = await supabase.rpc("nutrition_soft_delete_meal", { p_meal_id: id });
  if (error) return jsonError(500, error.message, rid);
  return jsonOk({ id, deleted: true }, rid);
}
