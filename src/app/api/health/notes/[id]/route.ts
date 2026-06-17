import { type NextRequest } from "next/server";
import { z } from "zod";
import { noteUpdateSchema } from "@/lib/health/schemas";
import { getAuthContext, jsonError, jsonOk, requestId } from "@/lib/owner";

const idSchema = z.string().uuid();

// PATCH — edit a note's fields.
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in to edit notes.", rid);

  const { id } = await ctx.params;
  if (!idSchema.safeParse(id).success) return jsonError(400, "Invalid note id.", rid);

  let body: ReturnType<typeof noteUpdateSchema.parse>;
  try {
    body = noteUpdateSchema.parse(await request.json());
  } catch (e) {
    return jsonError(400, "Invalid update payload.", rid, {
      details: e instanceof Error ? e.message : undefined,
    });
  }

  const { data, error } = await supabase
    .from("health_notes")
    .update(body)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return jsonError(500, error.message, rid);
  if (!data) return jsonError(404, "Note not found.", rid);
  return jsonOk({ note: data }, rid);
}

// DELETE — permanently remove a note.
export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in to delete notes.", rid);

  const { id } = await ctx.params;
  if (!idSchema.safeParse(id).success) return jsonError(400, "Invalid note id.", rid);

  const { error } = await supabase.from("health_notes").delete().eq("id", id);
  if (error) return jsonError(500, error.message, rid);
  return jsonOk({ id, deleted: true }, rid);
}
