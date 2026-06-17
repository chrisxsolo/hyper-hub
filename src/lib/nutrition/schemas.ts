// Request validation schemas for the nutrition mutation API. Item/meal shapes
// use snake_case to match the DB columns the server functions consume.

import { z } from "zod";
import { MEAL_TYPES } from "./types";

export const itemRowSchema = z.object({
  position: z.number().int().optional(),
  original_phrase: z.string().nullable().optional(),
  name: z.string().min(1).max(200),
  brand: z.string().max(120).nullable().optional(),
  quantity: z.number().nullable().optional(),
  quantity_min: z.number().nullable().optional(),
  quantity_max: z.number().nullable().optional(),
  unit: z.string().max(40).default("serving"),
  preparation_state: z.string().max(120).nullable().optional(),
  calories: z.number().nullable().optional(),
  protein_g: z.number().nullable().optional(),
  grams: z.number().nullable().optional(),
  calories_per_100g: z.number().nullable().optional(),
  protein_per_100g: z.number().nullable().optional(),
  nutrition_basis: z.string().default("per_serving"),
  source_type: z.string().default("ai_estimate"),
  source_name: z.string().nullable().optional(),
  source_url: z.string().nullable().optional(),
  source_retrieved_at: z.string().nullable().optional(),
  confidence: z.number().nullable().optional(),
  assumptions: z.array(z.string()).default([]),
  verified: z.boolean().default(false),
});
export type ItemRow = z.infer<typeof itemRowSchema>;

export const mealRowSchema = z.object({
  meal_type: z.enum(MEAL_TYPES),
  consumed_at: z.string(),
  eaten_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  original_text: z.string().max(4000).default(""),
  confidence: z.number().nullable().optional(),
  assumptions: z.array(z.string()).default([]),
  note: z.string().max(2000).nullable().optional(),
  client_token: z.string().uuid().optional(),
});

export const createMealSchema = z.object({
  meal: mealRowSchema,
  items: z.array(itemRowSchema).min(1).max(40),
});

export const updateMealSchema = z.object({
  patch: z
    .object({
      meal_type: z.enum(MEAL_TYPES).optional(),
      eaten_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      consumed_at: z.string().optional(),
      original_text: z.string().max(4000).optional(),
      note: z.string().max(2000).nullable().optional(),
    })
    .default({}),
  items: z.array(itemRowSchema).max(40).nullable().optional(),
});

export const duplicateSchema = z.object({
  eatenOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  asNow: z.boolean().default(true),
});
