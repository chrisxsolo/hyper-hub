// Request validation schemas for the health-notes and grocery mutation APIs.
// snake_case fields match the DB columns the routes write directly.

import { z } from "zod";
import { NOTE_CATEGORIES } from "./notes";

// ── Notes ──────────────────────────────────────────────────────────────────
export const noteCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().max(20000).default(""),
  category: z.enum(NOTE_CATEGORIES),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});

export const noteUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    content: z.string().max(20000).optional(),
    category: z.enum(NOTE_CATEGORIES).optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  })
  .refine((p) => Object.keys(p).length > 0, { message: "No fields to update." });

// ── Grocery ──────────────────────────────────────────────────────────────────
export const groceryCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  quantity: z.string().trim().max(60).nullable().optional(),
  category: z.string().trim().max(60).nullable().optional(),
  position: z.number().int().optional(),
  product_id: z.string().uuid().nullable().optional(),
});

export const groceryUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    quantity: z.string().trim().max(60).nullable().optional(),
    category: z.string().trim().max(60).nullable().optional(),
    checked: z.boolean().optional(),
    position: z.number().int().optional(),
    product_id: z.string().uuid().nullable().optional(),
  })
  .refine((p) => Object.keys(p).length > 0, { message: "No fields to update." });
