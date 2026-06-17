import { getViewer } from "@/lib/supabase/server";
import { loadAllOverview } from "@/lib/products/server";
import ProductsClient from "./ProductsClient";
import type { ProductOverview } from "@/lib/products/types";

// Private tool — the product database is owner-only (no public-read RLS).
// Visitors see a sign-in prompt; the owner sees their full product database.
const OWNER_EMAIL = "chrissolorzano118@gmail.com";

export const metadata = {
  title: "My Costco Products — Hyper Hub",
  description: "A personal Costco product and price database built by scanning.",
};

export default async function ProductsPage() {
  const { supabase, email } = await getViewer();
  const canEdit = email === OWNER_EMAIL;

  let products: ProductOverview[] = [];
  if (canEdit) {
    products = await loadAllOverview(supabase);
  }

  return <ProductsClient email={email} canEdit={canEdit} initialProducts={products} />;
}
