import { getViewer } from "@/lib/supabase/server";
import GroceryClient from "./GroceryClient";
import type { DbGroceryItem } from "@/lib/health/grocery";

// Private tool — the list is owner-only (no public-read RLS). Visitors see a
// sign-in prompt; the owner sees their full grocery list.
const OWNER_EMAIL = "chrissolorzano118@gmail.com";

export const metadata = {
  title: "Grocery List — Hyper Hub",
  description: "A running grocery list.",
};

export default async function GroceryPage() {
  const { supabase, email } = await getViewer();
  const canEdit = email === OWNER_EMAIL;

  let items: DbGroceryItem[] = [];
  if (canEdit) {
    const { data } = await supabase
      .from("grocery_items")
      .select("*")
      .order("checked", { ascending: true })
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    items = (data as DbGroceryItem[]) ?? [];
  }

  return <GroceryClient email={email} canEdit={canEdit} initialItems={items} />;
}
