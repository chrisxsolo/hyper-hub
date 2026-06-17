import { type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthContext, jsonError, jsonOk, requestId } from "@/lib/nutrition/server";

const idSchema = z.string().uuid();

// Restore a soft-deleted meal (undo).
export async function POST(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in as the owner.", rid);

  const { id } = await ctx.params;
  if (!idSchema.safeParse(id).success) return jsonError(400, "Invalid meal id.", rid);

  const { error } = await supabase.rpc("nutrition_restore_meal", { p_meal_id: id });
  if (error) return jsonError(500, error.message, rid);
  return jsonOk({ id, restored: true }, rid);
}
