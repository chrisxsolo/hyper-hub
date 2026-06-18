// Satiety / behavior ratings for a logged meal (spec §11). A 1–5 fullness score
// plus how hungry I was 2–3 h later and any cravings — captured retrospectively
// to surface which meals keep me full and which trigger overeating. Pure and
// client-safe: just the shared shape, labels, and a tiny summary used by the UI
// (and, later, the weekly dashboard's average-satiety figure).

// The editable payload the satiety editor sends and the API accepts (camelCase).
export type SatietyInput = {
  satietyScore: number | null;
  hungerAfter2h: number | null;
  hungerAfter3h: number | null;
  cravingsAfterMeal: number | null;
  note: string | null;
};

// The snake_case columns as they live on a meal row.
export type SatietyRatings = {
  satiety_score: number | null;
  hunger_after_2h: number | null;
  hunger_after_3h: number | null;
  cravings_after_meal: number | null;
  satiety_note: string | null;
};

// True when a meal has any satiety data recorded.
export function hasSatiety(r: Partial<SatietyRatings>): boolean {
  return (
    r.satiety_score != null ||
    r.hunger_after_2h != null ||
    r.hunger_after_3h != null ||
    r.cravings_after_meal != null ||
    (r.satiety_note != null && r.satiety_note.trim() !== "")
  );
}

// An integer 1–5, or null for anything else (defensive sanitize shared by the
// API and the editor).
export function coerceRating(n: unknown): number | null {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

// 1–5 fullness → short label (higher = more full / satisfied).
export function satietyLabel(score: number): string {
  return (
    { 1: "Still hungry", 2: "Barely satisfied", 3: "Satisfied", 4: "Full", 5: "Very full" }[
      score
    ] ?? ""
  );
}

// 1–5 hunger-after / cravings → short label (higher = hungrier / stronger urge).
export function hungerLabel(score: number): string {
  return (
    { 1: "None", 2: "Slight", 3: "Moderate", 4: "Strong", 5: "Intense" }[score] ?? ""
  );
}

// Dot color for a rating. Fullness is good when high; hunger/cravings are good
// when low, so they pass higherIsBetter=false to invert the scale.
export function ratingColor(score: number, higherIsBetter: boolean): string {
  const v = higherIsBetter ? score : 6 - score;
  if (v >= 4) return "#34d399"; // green
  if (v >= 3) return "#fbbf24"; // amber
  return "#f87171"; // red
}
