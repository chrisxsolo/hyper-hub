// Metadata for blood markers: which panel/category they belong to, a plain-language
// description, and notes shown when a value falls outside its reference range.
// Used by the Metrics → Blood view to group, visualize, and analyze a lab panel.

export type MarkerMeta = {
  category: string;
  about: string;
  /** For markers where a higher value is the goal (e.g. HDL). */
  higherIsBetter?: boolean;
  /** Friendly context shown when the marker is out of range. */
  flagNote?: string;
};

// Order panels are rendered in (best-news-first, roughly).
export const CATEGORY_ORDER = [
  "Lipid Panel",
  "Metabolic & Electrolytes",
  "Kidney",
  "Liver & Protein",
  "Complete Blood Count",
] as const;

export const MARKER_META: Record<string, MarkerMeta> = {
  // ── Lipid Panel ──
  "Total Cholesterol": {
    category: "Lipid Panel",
    about: "All cholesterol carried in the blood.",
  },
  HDL: {
    category: "Lipid Panel",
    about: '"Good" cholesterol — clears excess from arteries. Higher is better.',
    higherIsBetter: true,
  },
  LDL: {
    category: "Lipid Panel",
    about: '"Bad" cholesterol — drives arterial plaque when elevated.',
  },
  VLDL: {
    category: "Lipid Panel",
    about: "Triglyceride-rich particles; tracks closely with triglycerides.",
  },
  Triglycerides: {
    category: "Lipid Panel",
    about: "Blood fat; high levels are linked to insulin resistance.",
  },

  // ── Metabolic & Electrolytes ──
  Glucose: {
    category: "Metabolic & Electrolytes",
    about: "Fasting blood sugar — a core metabolic marker.",
  },
  Sodium: {
    category: "Metabolic & Electrolytes",
    about: "Key electrolyte governing fluid balance.",
  },
  Potassium: {
    category: "Metabolic & Electrolytes",
    about: "Electrolyte essential for nerve and heart function.",
  },
  Chloride: {
    category: "Metabolic & Electrolytes",
    about: "Electrolyte that pairs with sodium.",
  },
  CO2: {
    category: "Metabolic & Electrolytes",
    about: "Bicarbonate — reflects blood acid/base balance.",
  },
  Calcium: {
    category: "Metabolic & Electrolytes",
    about: "Mineral for bones, muscle, and nerve signalling.",
  },

  // ── Kidney ──
  BUN: {
    category: "Kidney",
    about: "Urea nitrogen — a kidney and hydration marker.",
    flagNote:
      "Mildly high BUN alongside a normal creatinine usually points to dehydration or a higher-protein diet rather than kidney disease.",
  },
  Creatinine: {
    category: "Kidney",
    about: "Muscle waste filtered by the kidneys; the core kidney marker.",
  },
  "BUN/Creatinine Ratio": {
    category: "Kidney",
    about: "Ratio that helps separate dehydration from true kidney issues.",
    flagNote:
      "An elevated ratio with a normal creatinine most often reflects mild dehydration or higher protein intake.",
  },

  // ── Liver & Protein ──
  ALT: {
    category: "Liver & Protein",
    about: "Liver enzyme; rises when the liver is stressed.",
  },
  AST: {
    category: "Liver & Protein",
    about: "Enzyme released by liver and muscle.",
  },
  "Alkaline Phosphatase": {
    category: "Liver & Protein",
    about: "Enzyme from liver and bone.",
  },
  "Bilirubin (Total)": {
    category: "Liver & Protein",
    about: "Breakdown product of red blood cells, cleared by the liver.",
  },
  Albumin: {
    category: "Liver & Protein",
    about: "The main blood protein, made by the liver.",
  },
  "Total Protein": {
    category: "Liver & Protein",
    about: "Albumin and globulins combined.",
  },
  Globulin: {
    category: "Liver & Protein",
    about: "Immune and transport proteins.",
  },

  // ── Complete Blood Count ──
  Hematocrit: {
    category: "Complete Blood Count",
    about: "Share of blood volume made up of red cells.",
  },
  Hemoglobin: {
    category: "Complete Blood Count",
    about: "Oxygen-carrying protein inside red blood cells.",
  },
};

export const DEFAULT_CATEGORY = "Other";
