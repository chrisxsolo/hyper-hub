import { type NextRequest } from "next/server";
import { z } from "zod";
import { duplicateSchema } from "@/lib/nutrition/schemas";
import { getAuthContext, jsonError, jsonOk, requestId } from "@/lib/nutrition/server";

const idSchema = z.string().uuid();

// Duplicate a meal (same day, or copy to another date).
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in as the owner.", rid);

  const { id } = await ctx.params;
  if (!idSchema.safeParse(id).success) return jsonError(400, "Invalid meal id.", rid);

  let body: ReturnType<typeof duplicateSchema.parse>;
  try {
    body = duplicateSchema.parse(await request.json().catch(() => ({})));
  } catch {
    return jsonError(400, "Invalid request.", rid);
  }

  const { data: newId, error } = await supabase.rpc("nutrition_duplicate_meal", {
    p_meal_id: id,
    p_eaten_on: body.eatenOn ?? null,
    p_as_now: body.asNow,
  });
  if (error) return jsonError(500, error.message, rid);
  return jsonOk({ id: newId }, rid, 201);
}
