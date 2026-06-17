import { createClient } from "@/lib/supabase/server";
import { guides } from "@/data/health/guides";
import type { DbNote } from "@/lib/health/notes";
import KnowledgeHubClient from "./KnowledgeHubClient";

// Health Knowledge Hub — a personal notebook. Curated educational guides
// (public) live alongside private personal notes (owner-only). Notes are only
// fetched/shown when signed in as the owner; visitors see the guides.
const OWNER_EMAIL = "chrissolorzano118@gmail.com";

export const metadata = {
  title: "Health Knowledge Hub — Hyper Hub",
  description: "Everything I've learned about health, nutrition, fitness, sleep, recovery, and more.",
};

export default async function HealthPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const canEdit = user?.email === OWNER_EMAIL;

  let notes: DbNote[] = [];
  if (canEdit) {
    const { data } = await supabase
      .from("health_notes")
      .select("*")
      .order("updated_at", { ascending: false });
    notes = (data as DbNote[]) ?? [];
  }

  return <KnowledgeHubClient guides={guides} initialNotes={notes} canEdit={canEdit} />;
}
