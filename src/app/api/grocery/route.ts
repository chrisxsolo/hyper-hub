import { type NextRequest } from "next/server";
import { groceryCreateSchema } from "@/lib/health/schemas";
import { enrichGroceryItems } from "@/lib/health/grocery-server";
import type { DbGroceryItem } from "@/lib/health/grocery";
import { getAuthContext, jsonError, jsonOk, requestId } from "@/lib/owner";

// The grocery list is private (owner-only RLS).

// GET — list items: unchecked first, then by position / age.
export async function GET() {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in to view your list.", rid);

  const { data, error } = await supabase
    .from("grocery_items")
    .select("*")
    .order("checked", { ascending: true })
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return jsonError(500, error.message, rid);
  const items = await enrichGroceryItems(supabase, (data ?? []) as DbGroceryItem[]);
  return jsonOk({ items }, rid);
}

// POST — add an item.
export async function POST(request: NextRequest) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in to add items.", rid);

  let body: ReturnType<typeof groceryCreateSchema.parse>;
  try {
    body = groceryCreateSchema.parse(await request.json());
  } catch (e) {
    return jsonError(400, "Invalid item payload.", rid, {
      details: e instanceof Error ? e.message : undefined,
    });
  }

  const { data, error } = await supabase
    .from("grocery_items")
    .insert({
      name: body.name,
      quantity: body.quantity ?? null,
      category: body.category ?? null,
      position: body.position ?? 0,
      product_id: body.product_id ?? null,
    })
    .select("*")
    .single();
  if (error) return jsonError(500, error.message, rid);
  const [enriched] = await enrichGroceryItems(supabase, [data as DbGroceryItem]);
  return jsonOk({ item: enriched }, rid, 201);
}
