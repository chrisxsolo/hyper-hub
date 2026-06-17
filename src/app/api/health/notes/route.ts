import { type NextRequest } from "next/server";
import { noteCreateSchema } from "@/lib/health/schemas";
import { getAuthContext, jsonError, jsonOk, requestId } from "@/lib/owner";

// Personal health notes are private (owner-only RLS). Both reading and writing
// require the owner session.

// GET — list all notes, newest-edited first.
export async function GET() {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in to view notes.", rid);

  const { data, error } = await supabase
    .from("health_notes")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) return jsonError(500, error.message, rid);
  return jsonOk({ notes: data ?? [] }, rid);
}

// POST — create a note.
export async function POST(request: NextRequest) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in to add notes.", rid);

  let body: ReturnType<typeof noteCreateSchema.parse>;
  try {
    body = noteCreateSchema.parse(await request.json());
  } catch (e) {
    return jsonError(400, "Invalid note payload.", rid, {
      details: e instanceof Error ? e.message : undefined,
    });
  }

  const { data, error } = await supabase
    .from("health_notes")
    .insert({
      title: body.title,
      content: body.content,
      category: body.category,
      tags: body.tags,
    })
    .select("*")
    .single();
  if (error) return jsonError(500, error.message, rid);
  return jsonOk({ note: data }, rid, 201);
}
