import { createClient } from "@/lib/supabase/server";
import NutritionClient from "./NutritionClient";

// Public dashboard — anyone can view (data is public-read, like the rest of the
// health section). Logging/editing is only offered when signed in as the owner.
const OWNER_EMAIL = "chrissolorzano118@gmail.com";

export const metadata = {
  title: "Nutrition Tracker — Hyper Hub",
  description: "Log meals naturally. Track calories and protein accurately.",
};

export default async function NutritionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? null;
  const canEdit = email === OWNER_EMAIL;

  return <NutritionClient email={email} canEdit={canEdit} />;
}
