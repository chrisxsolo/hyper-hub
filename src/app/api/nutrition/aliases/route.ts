import { type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthContext, jsonError, jsonOk, requestId } from "@/lib/nutrition/server";

const schema = z.object({
  phrase: z.string().min(2).max(120),
  template_id: z.string().uuid(),
  note: z.string().max(280).nullable().optional(),
});

export async function POST(request: NextRequest) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in as the owner.", rid);

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch (e) {
    return jsonError(400, "Invalid alias.", rid, { details: e instanceof Error ? e.message : undefined });
  }

  const { data, error } = await supabase
    .from("nutrition_aliases")
    .upsert(
      { phrase: body.phrase.toLowerCase().trim(), template_id: body.template_id, note: body.note ?? null },
      { onConflict: "phrase" },
    )
    .select("id")
    .single();
  if (error) return jsonError(500, error.message, rid);
  return jsonOk({ id: data.id }, rid, 201);
}
