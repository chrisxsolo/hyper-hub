// Client-safe types + constants for the health_notes table (the Knowledge Hub's
// personal notebook). No server-only imports here — used by the hub client.

export const NOTE_CATEGORIES = [
  "Nutrition",
  "Fitness and Running",
  "Strength Training",
  "Sleep and Recovery",
  "Dental Health",
  "Hair Health",
  "Lab Results",
  "General Health Notes",
] as const;

export type NoteCategory = (typeof NOTE_CATEGORIES)[number];

export type DbNote = {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

// Visual accent per category — keeps the unified feed legible at a glance.
export const CATEGORY_META: Record<string, { emoji: string; accent: string; chip: string }> = {
  Nutrition: { emoji: "🥗", accent: "text-emerald-300", chip: "bg-emerald-500/10 text-emerald-300/90 border-emerald-500/20" },
  "Fitness and Running": { emoji: "🏃", accent: "text-green-300", chip: "bg-green-500/10 text-green-300/90 border-green-500/20" },
  "Strength Training": { emoji: "🏋️", accent: "text-orange-300", chip: "bg-orange-500/10 text-orange-300/90 border-orange-500/20" },
  "Sleep and Recovery": { emoji: "😴", accent: "text-indigo-300", chip: "bg-indigo-500/10 text-indigo-300/90 border-indigo-500/20" },
  "Dental Health": { emoji: "🦷", accent: "text-sky-300", chip: "bg-sky-500/10 text-sky-300/90 border-sky-500/20" },
  "Hair Health": { emoji: "💇", accent: "text-purple-300", chip: "bg-purple-500/10 text-purple-300/90 border-purple-500/20" },
  "Lab Results": { emoji: "🧪", accent: "text-rose-300", chip: "bg-rose-500/10 text-rose-300/90 border-rose-500/20" },
  "General Health Notes": { emoji: "📝", accent: "text-amber-300", chip: "bg-amber-500/10 text-amber-300/90 border-amber-500/20" },
};

export function categoryMeta(category: string) {
  return CATEGORY_META[category] ?? { emoji: "📝", accent: "text-amber-300", chip: "bg-white/5 text-readable-soft border-white/10" };
}

export function fmtNoteDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
