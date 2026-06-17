import { type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthContext, jsonError, jsonOk, requestId } from "@/lib/nutrition/server";

const idSchema = z.string().uuid();
const patchSchema = z.object({
  verified: z.boolean().optional(),
  calories_per_100g: z.number().nullable().optional(),
  protein_per_100g: z.number().nullable().optional(),
  serving_calories: z.number().nullable().optional(),
  serving_protein_g: z.number().nullable().optional(),
});

// Manage a saved/cached food: edit its values/verified flag, or remove it.
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in as the owner.", rid);
  const { id } = await ctx.params;
  if (!idSchema.safeParse(id).success) return jsonError(400, "Invalid id.", rid);

  let patch: z.infer<typeof patchSchema>;
  try {
    patch = patchSchema.parse(await request.json());
  } catch {
    return jsonError(400, "Invalid payload.", rid);
  }
  const { error } = await supabase.from("nutrition_foods").update(patch).eq("id", id);
  if (error) return jsonError(500, error.message, rid);
  return jsonOk({ id }, rid);
}

export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in as the owner.", rid);
  const { id } = await ctx.params;
  if (!idSchema.safeParse(id).success) return jsonError(400, "Invalid id.", rid);

  const { error } = await supabase.from("nutrition_foods").delete().eq("id", id);
  if (error) return jsonError(500, error.message, rid);
  return jsonOk({ id, deleted: true }, rid);
}
