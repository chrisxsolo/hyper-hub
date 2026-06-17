import { type NextRequest } from "next/server";
import { z } from "zod";
import { groceryUpdateSchema } from "@/lib/health/schemas";
import { getAuthContext, jsonError, jsonOk, requestId } from "@/lib/owner";

const idSchema = z.string().uuid();

// PATCH — toggle checked / edit fields.
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in to edit items.", rid);

  const { id } = await ctx.params;
  if (!idSchema.safeParse(id).success) return jsonError(400, "Invalid item id.", rid);

  let body: ReturnType<typeof groceryUpdateSchema.parse>;
  try {
    body = groceryUpdateSchema.parse(await request.json());
  } catch (e) {
    return jsonError(400, "Invalid update payload.", rid, {
      details: e instanceof Error ? e.message : undefined,
    });
  }

  const { data, error } = await supabase
    .from("grocery_items")
    .update(body)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return jsonError(500, error.message, rid);
  if (!data) return jsonError(404, "Item not found.", rid);
  return jsonOk({ item: data }, rid);
}

// DELETE — remove an item.
export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in to delete items.", rid);

  const { id } = await ctx.params;
  if (!idSchema.safeParse(id).success) return jsonError(400, "Invalid item id.", rid);

  const { error } = await supabase.from("grocery_items").delete().eq("id", id);
  if (error) return jsonError(500, error.message, rid);
  return jsonOk({ id, deleted: true }, rid);
}
