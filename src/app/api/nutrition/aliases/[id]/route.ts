import { type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthContext, jsonError, jsonOk, requestId } from "@/lib/nutrition/server";

const idSchema = z.string().uuid();

export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in as the owner.", rid);
  const { id } = await ctx.params;
  if (!idSchema.safeParse(id).success) return jsonError(400, "Invalid id.", rid);

  const { error } = await supabase.from("nutrition_aliases").delete().eq("id", id);
  if (error) return jsonError(500, error.message, rid);
  return jsonOk({ id, deleted: true }, rid);
}
