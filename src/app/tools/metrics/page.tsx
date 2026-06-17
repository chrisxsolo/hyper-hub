import { getViewer } from "@/lib/supabase/server";
import MetricsClient from "./MetricsClient";

// Public dashboard — anyone can view the charts (data is public-read in the DB).
// Editing (add/delete) is only offered when signed in as the owner.
const OWNER_EMAIL = "chrissolorzano118@gmail.com";

export default async function MetricsPage() {
  const { email } = await getViewer();
  const canEdit = email === OWNER_EMAIL;

  return <MetricsClient email={email} canEdit={canEdit} />;
}
