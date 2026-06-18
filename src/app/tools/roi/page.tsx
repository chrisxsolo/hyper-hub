import { getViewer } from "@/lib/supabase/server";
import { loadAllOverview } from "@/lib/products/server";
import { withMetrics, type RankedProduct } from "@/lib/products/rankings";
import RoiClient from "./RoiClient";

// Private tool — ranks the owner's Costco product database by nutrition-vs-price
// ROI (spec §24). Reuses the same overview rows + value-metric math as the
// product database; visitors get a sign-in prompt.
const OWNER_EMAIL = "chrissolorzano118@gmail.com";

export const metadata = {
  title: "Food ROI Rankings — Hyper Hub",
  description:
    "Rank Costco products by protein per dollar, lean-protein density, and cost per serving.",
};

export default async function RoiPage() {
  const { supabase, email } = await getViewer();
  const canEdit = email === OWNER_EMAIL;

  let ranked: RankedProduct[] = [];
  if (canEdit) {
    ranked = withMetrics(await loadAllOverview(supabase));
  }

  return <RoiClient email={email} canEdit={canEdit} ranked={ranked} />;
}
