import { getAuthContext, jsonError, jsonOk, requestId } from "@/lib/owner";

// POST — clear all completed (checked) items in one shot.
export async function POST() {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in to clear items.", rid);

  const { error } = await supabase.from("grocery_items").delete().eq("checked", true);
  if (error) return jsonError(500, error.message, rid);
  return jsonOk({ cleared: true }, rid);
}
