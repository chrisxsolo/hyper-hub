// Server-side Claude integration. Claude's job is PARSING and normalization —
// turning natural language into structured food items, interpreting quantities
// and units, identifying brands, and stating its assumptions. It also supplies a
// provisional estimate, but authoritative numbers come from the cache / USDA in
// resolve.ts. Claude is the labeled fallback, never the primary nutrition DB.
//
// Server-only: imported solely by the analyze route handler.

import Anthropic from "@anthropic-ai/sdk";
import { claudeMealSchema, type ClaudeMeal, type NutritionSettings } from "./types";

const MODEL = process.env.NUTRITION_MODEL || "claude-opus-4-8";

// Raw JSON schema for the forced tool. Field descriptions double as parsing
// instructions, so the model fills each one correctly.
const ITEM_PROPERTIES = {
  originalPhrase: { type: "string", description: "The exact span of the user's text this item came from." },
  normalizedName: { type: "string", description: "Clean, canonical food name, lowercase, no quantity. e.g. 'chicken breast', 'basmati rice', 'large egg'." },
  brand: { type: ["string", "null"], description: "Brand or restaurant if this is a branded/restaurant item (e.g. 'In-N-Out', 'Trader Joe's'), else null." },
  quantity: { type: ["number", "null"], description: "Numeric amount in `unit`. Null if the user gave only a vague amount ('a handful')." },
  quantityMin: { type: ["number", "null"], description: "Lower bound if the user gave a range ('175 to 285 g'), else null." },
  quantityMax: { type: ["number", "null"], description: "Upper bound if the user gave a range, else null." },
  unit: { type: "string", description: "Unit for quantity: g, oz, lb, cup, tbsp, tsp, ml, slice, item, piece, serving, handful, scoop, etc. Use 'item' for whole foods like eggs or apples." },
  preparationState: { type: ["string", "null"], description: "cooked/raw, with/without skin, lean %, drained, etc. State your assumption here when the user didn't specify." },
  gramsEstimate: { type: ["number", "null"], description: "Your best estimate of the TOTAL grams of this portion (e.g. 1 cup cooked rice ≈ 158 g). Always provide this for generic foods so per-100g data can be scaled. Null only if truly unknowable." },
  usdaQuery: { type: ["string", "null"], description: "A clean, generic search phrase for the USDA database (e.g. 'chicken breast cooked roasted', 'rice white cooked'). Null for branded/restaurant items where a generic lookup would mislead." },
  isRestaurant: { type: "boolean", description: "True for restaurant, fast-food, or branded packaged items." },
  calories: { type: ["number", "null"], description: "Your best estimate of total calories for this portion." },
  proteinGrams: { type: ["number", "null"], description: "Your best estimate of total protein in grams for this portion." },
  nutritionBasis: { type: "string", enum: ["per_item", "per_100g", "per_serving"], description: "What the underlying nutrition is anchored to." },
  sourceType: { type: "string", enum: ["personal", "official_restaurant", "usda", "manufacturer", "nutrition_database", "ai_estimate", "manual"], description: "Where your numbers come from. Use 'official_restaurant' only when you are recalling published figures for a named chain item; otherwise 'ai_estimate'." },
  sourceName: { type: ["string", "null"], description: "Human name of the source, e.g. 'In-N-Out (published)', else null." },
  sourceUrl: { type: ["string", "null"], description: "URL of the source if you are confident it is correct, else null." },
  confidence: { type: "number", description: "0–1 confidence in this item's numbers." },
  assumptions: { type: "array", items: { type: "string" }, description: "Plain-language assumptions you made, e.g. 'Eggs interpreted as large'." },
  requiresConfirmation: { type: "boolean", description: "True when a range, vague amount, or risky assumption means the user should confirm before saving." },
} as const;

const TOOL = {
  name: "record_parsed_meal",
  description: "Record the structured interpretation of a natural-language meal description.",
  input_schema: {
    type: "object" as const,
    properties: {
      mealType: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack", "other"] },
      consumedAt: { type: ["string", "null"], description: "ISO timestamp if the user implied a time, else null." },
      originalText: { type: "string", description: "Echo of the user's full original description." },
      items: { type: "array", items: { type: "object", properties: ITEM_PROPERTIES, required: Object.keys(ITEM_PROPERTIES), additionalProperties: false } },
      assumptions: { type: "array", items: { type: "string" }, description: "Meal-level assumptions." },
      confidence: { type: "number", description: "0–1 overall confidence for the meal." },
    },
    required: ["mealType", "consumedAt", "originalText", "items", "assumptions", "confidence"],
    additionalProperties: false,
  },
};

function systemPrompt(settings: NutritionSettings | null, mealTypeHint: string): string {
  const s = settings;
  return [
    "You convert a natural-language meal description into a precise, structured list of foods.",
    "You are a careful nutrition parser, NOT a calorie database: your strengths are normalizing food names, interpreting quantities and units, identifying brands, resolving ambiguous preparation states, and stating assumptions explicitly.",
    "",
    "Rules:",
    "- Break the meal into individual foods. Each food is one item.",
    "- Interpret quantities and units literally; convert nothing — record the user's unit and a `gramsEstimate` for the whole portion.",
    "- Always provide `gramsEstimate` and a generic `usdaQuery` for non-branded foods so authoritative per-100g data can be applied later.",
    "- For ranges ('175 to 285 g') set quantityMin/quantityMax, leave quantity null, and set requiresConfirmation true.",
    "- For vague amounts ('a handful', 'about a cup', 'roughly half') pick a transparent midpoint, note it in assumptions, and set requiresConfirmation true.",
    "- For restaurant/branded items (In-N-Out 4x4, Chipotle, Trader Joe's, Costco, pizza chains) set isRestaurant true, set brand, and prefer published figures. If a specific item (e.g. an In-N-Out 4x4) has no single published number, derive it transparently from official components and note that in assumptions.",
    "- Disclose every assumption in plain language. Never invent false precision.",
    "- Provide your best calories/proteinGrams estimate for every item, but set sourceType honestly ('ai_estimate' unless you are recalling real published/official data).",
    "- Use neutral, non-judgmental framing.",
    "",
    "User's saved defaults (apply these and state them as assumptions when relevant):",
    s ? `- Rice is usually ${s.rice_default}.` : "- Rice is usually cooked.",
    s ? `- Chicken weights are usually ${s.chicken_default}.` : "- Chicken weights are usually cooked.",
    s ? `- Eggs are usually ${s.egg_size_default}.` : "- Eggs are usually large.",
    s ? `- Default milk is ${s.default_milk}.` : "- Default milk is unsweetened almond milk.",
    "",
    `If the meal type is ambiguous, default to '${mealTypeHint}'.`,
    "Call record_parsed_meal exactly once with the full interpretation.",
  ].join("\n");
}

export class MissingApiKeyError extends Error {}

export async function parseMeal(opts: {
  text: string;
  mealType: string;
  consumedAt: string | null;
  settings: NutritionSettings | null;
}): Promise<ClaudeMeal> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new MissingApiKeyError(
      "ANTHROPIC_API_KEY is not configured on the server. Add it to .env.local (and your deployment env) to enable meal analysis.",
    );
  }
  const client = new Anthropic({ apiKey });

  const userContent =
    `Meal type hint: ${opts.mealType}\n` +
    (opts.consumedAt ? `Consumed at: ${opts.consumedAt}\n` : "") +
    `Description:\n${opts.text}`;

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: systemPrompt(opts.settings, opts.mealType),
    tools: [TOOL],
    tool_choice: { type: "tool", name: TOOL.name },
    messages: [{ role: "user", content: userContent }],
  });

  const block = resp.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("Claude did not return a structured meal.");
  }

  const parsed = claudeMealSchema.safeParse(block.input);
  if (!parsed.success) {
    throw new Error("Claude returned an unexpected shape: " + parsed.error.message);
  }
  // Ensure the original text is preserved verbatim.
  parsed.data.originalText = opts.text;
  return parsed.data;
}
