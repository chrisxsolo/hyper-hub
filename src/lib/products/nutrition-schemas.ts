// Zod schemas for the product-nutrition API boundary. `scannedNutritionSchema`
// validates Claude's forced-tool output from a nutrition-label photo;
// `nutritionVersionSaveSchema` validates the confirmed values the review screen
// saves. Numeric values are kept in the label's standard units (g for macros,
// mg for sodium/minerals, mcg for vitamin D).

import { z } from "zod";

// Accept either a number or a numeric string and coerce to a finite number;
// anything else → null. (Mirrors the preprocessor in schemas.ts.)
const num = z.preprocess((v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "string" ? Number(v.replace(/[^0-9.\-]/g, "")) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}, z.number().nullable());

const str = z.preprocess(
  (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null),
  z.string().max(400).nullable(),
);

const additionalNutrient = z.object({
  name: z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : ""),
    z.string().max(80),
  ),
  value: num,
  unit: str,
});

// Claude's forced-tool output for a scanned nutrition-facts label.
export const scannedNutritionSchema = z.object({
  servingSizeDescription: str,
  servingSizeValue: num,
  servingSizeUnit: str,
  servingsPerContainer: num,
  calories: num,
  totalFatG: num,
  saturatedFatG: num,
  transFatG: num,
  cholesterolMg: num,
  sodiumMg: num,
  totalCarbohydrateG: num,
  dietaryFiberG: num,
  totalSugarsG: num,
  addedSugarsG: num,
  proteinG: num,
  vitaminDMcg: num,
  calciumMg: num,
  ironMg: num,
  potassiumMg: num,
  additionalNutrients: z.array(additionalNutrient).default([]),
  lowConfidenceFields: z.array(z.string()).default([]),
  confidence: z.preprocess(
    (v) => (typeof v === "number" && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.5),
    z.number(),
  ),
  notes: str,
});

// POST /api/products/[id]/nutrition/scan — the client uploads a downscaled
// JPEG/PNG of the nutrition label as base64.
export const nutritionScanRequestSchema = z.object({
  imageBase64: z.string().min(1).max(20_000_000),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

// A single optional numeric field the review screen may save.
const optNum = z.number().nullable().optional();

// POST /api/products/[id]/nutrition — save a confirmed nutrition version.
export const nutritionVersionSaveSchema = z.object({
  servingSizeDescription: z.string().trim().max(200).nullable().optional(),
  servingSizeValue: optNum,
  servingSizeUnit: z.string().trim().max(20).nullable().optional(),
  servingsPerContainer: optNum,
  calories: optNum,
  totalFatG: optNum,
  saturatedFatG: optNum,
  transFatG: optNum,
  cholesterolMg: optNum,
  sodiumMg: optNum,
  totalCarbohydrateG: optNum,
  dietaryFiberG: optNum,
  totalSugarsG: optNum,
  addedSugarsG: optNum,
  proteinG: optNum,
  vitaminDMcg: optNum,
  calciumMg: optNum,
  ironMg: optNum,
  potassiumMg: optNum,
  additionalNutrients: z
    .array(z.object({ name: z.string().max(80), value: z.number().nullable(), unit: z.string().max(20).nullable() }))
    .max(40)
    .nullable()
    .optional(),
  sourceImagePath: z.string().trim().max(400).nullable().optional(),
  recognitionConfidence: z.record(z.string(), z.number()).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  observedAt: z.string().max(40).nullable().optional(),
});

export type ScanNutritionRequest = z.infer<typeof nutritionScanRequestSchema>;
export type NutritionVersionSave = z.infer<typeof nutritionVersionSaveSchema>;
