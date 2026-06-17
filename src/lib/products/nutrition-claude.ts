// Server-side Claude vision integration for nutrition-facts label scanning.
// Claude's job is RECOGNITION and structured extraction from a photo of a
// Nutrition Facts panel — never to invent values it can't read. Uncertain fields
// are flagged in `lowConfidenceFields` so the review screen highlights them;
// the owner always confirms before anything is saved.
//
// Server-only: imported solely by the nutrition-scan route handler.

import Anthropic from "@anthropic-ai/sdk";
import { scannedNutritionSchema } from "./nutrition-schemas";
import type { ScannedNutrition } from "./types";
import { MissingApiKeyError } from "./claude";

const MODEL = process.env.PRODUCT_SCAN_MODEL || process.env.NUTRITION_MODEL || "claude-opus-4-8";

// Field descriptions double as extraction instructions. Values must be read in
// the label's standard units (US labels: g for fats/carbs/protein/fiber/sugars,
// mg for sodium/cholesterol/calcium/iron/potassium, mcg for vitamin D).
const PROPERTIES = {
  servingSizeDescription: { type: ["string", "null"], description: "The serving size exactly as printed, e.g. '4 oz (112 g)', '2/3 cup (55g)', '1 bar'. Null if unreadable." },
  servingSizeValue: { type: ["number", "null"], description: "The numeric serving size in the metric unit shown in parentheses, e.g. 112 for '4 oz (112 g)', 55 for '(55g)'. Use the gram weight when shown; otherwise the primary numeric amount. Null if none." },
  servingSizeUnit: { type: ["string", "null"], description: "Unit for servingSizeValue: 'g', 'ml', 'oz', 'piece', etc. Prefer 'g' or 'ml' when a metric weight/volume is printed." },
  servingsPerContainer: { type: ["number", "null"], description: "Servings per container, e.g. 10 for 'About 10 servings'. Null if not printed." },
  calories: { type: ["number", "null"], description: "Calories per serving." },
  totalFatG: { type: ["number", "null"], description: "Total Fat in grams per serving." },
  saturatedFatG: { type: ["number", "null"], description: "Saturated Fat in grams." },
  transFatG: { type: ["number", "null"], description: "Trans Fat in grams." },
  cholesterolMg: { type: ["number", "null"], description: "Cholesterol in milligrams." },
  sodiumMg: { type: ["number", "null"], description: "Sodium in milligrams." },
  totalCarbohydrateG: { type: ["number", "null"], description: "Total Carbohydrate in grams." },
  dietaryFiberG: { type: ["number", "null"], description: "Dietary Fiber in grams." },
  totalSugarsG: { type: ["number", "null"], description: "Total Sugars in grams." },
  addedSugarsG: { type: ["number", "null"], description: "Added Sugars in grams (the 'Includes Xg Added Sugars' line)." },
  proteinG: { type: ["number", "null"], description: "Protein in grams per serving." },
  vitaminDMcg: { type: ["number", "null"], description: "Vitamin D in micrograms (mcg)." },
  calciumMg: { type: ["number", "null"], description: "Calcium in milligrams." },
  ironMg: { type: ["number", "null"], description: "Iron in milligrams." },
  potassiumMg: { type: ["number", "null"], description: "Potassium in milligrams." },
  additionalNutrients: {
    type: "array",
    items: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nutrient name as printed, e.g. 'Vitamin C', 'Magnesium', 'Vitamin B12'." },
        value: { type: ["number", "null"], description: "Numeric amount." },
        unit: { type: ["string", "null"], description: "Unit as printed: 'mg', 'mcg', 'g', '%', etc." },
      },
      required: ["name", "value", "unit"],
      additionalProperties: false,
    },
    description: "Any OTHER nutrients printed that don't have a dedicated field above (Vitamin A/C, Magnesium, Zinc, Phosphorus, Folate, B12, etc.). Empty array if none.",
  },
  lowConfidenceFields: { type: "array", items: { type: "string" }, description: "Names of any fields above whose value you are NOT confident about (blurry, partially obscured, ambiguous). Use the exact property names, e.g. ['proteinG','servingSizeValue']." },
  confidence: { type: "number", description: "0–1 overall confidence in this extraction." },
  notes: { type: ["string", "null"], description: "Anything notable: dual-column labels (per serving vs per container), 'as prepared' values, or why a field was hard to read. Null if nothing." },
} as const;

const TOOL = {
  name: "record_nutrition_facts",
  description: "Record the structured Nutrition Facts extracted from the label image.",
  input_schema: {
    type: "object" as const,
    properties: PROPERTIES,
    required: Object.keys(PROPERTIES),
    additionalProperties: false,
  },
};

const SYSTEM = [
  "You extract structured Nutrition Facts from a single photo of a product's Nutrition Facts panel.",
  "",
  "Rules:",
  "- Report ONLY what you can actually read. Never invent or estimate a value that isn't printed.",
  "- For any field you cannot read with confidence, set it to null AND add its property name to lowConfidenceFields.",
  "- Read every value PER SERVING. If the label has two columns (per serving / per container), use the per-serving column and note it.",
  "- Keep values in the label's standard units: grams for fats/carbs/fiber/sugars/protein, milligrams for sodium/cholesterol/calcium/iron/potassium, micrograms for vitamin D. Do not convert to %DV.",
  "- For the serving size, capture the full printed description, and set servingSizeValue/servingSizeUnit to the metric weight/volume in parentheses when present (e.g. 112 g).",
  "- Put any nutrient without a dedicated field into additionalNutrients with its value and unit.",
  "Call record_nutrition_facts exactly once.",
].join("\n");

export async function scanNutrition(opts: {
  base64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
}): Promise<ScannedNutrition> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new MissingApiKeyError(
      "ANTHROPIC_API_KEY is not configured on the server. Add it to .env.local (and your deployment env) to enable nutrition scanning.",
    );
  }
  const client = new Anthropic({ apiKey });

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM,
    tools: [TOOL],
    tool_choice: { type: "tool", name: TOOL.name },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: opts.mediaType, data: opts.base64 },
          },
          {
            type: "text",
            text: "Extract the Nutrition Facts from this label. Flag anything you are unsure about.",
          },
        ],
      },
    ],
  });

  const block = resp.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("Claude did not return structured nutrition facts.");
  }

  const parsed = scannedNutritionSchema.safeParse(block.input);
  if (!parsed.success) {
    throw new Error("Claude returned an unexpected shape: " + parsed.error.message);
  }
  return parsed.data as ScannedNutrition;
}
