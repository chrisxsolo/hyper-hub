// Zod schemas for the products API boundary. The scan schema validates Claude's
// tool output; the create/price/update schemas validate what the client saves.

import { z } from "zod";
import { PRODUCT_SOURCE_TYPES } from "./types";

// Accept either a number or a numeric string (Claude occasionally returns "3.94")
// and coerce to a finite number; anything else → null.
const num = z.preprocess((v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "string" ? Number(v.replace(/[^0-9.\-]/g, "")) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}, z.number().nullable());

// Truncate rather than reject: an over-long free-text field (usually `notes`)
// must never discard an otherwise-good extraction.
const str = z.preprocess((v) => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t.slice(0, 400);
}, z.string().max(400).nullable());

// Claude's forced-tool output for a scanned image.
export const scannedProductSchema = z.object({
  name: str,
  brand: str,
  variant: str,
  category: str,
  barcode: str,
  costcoItemNumber: str,
  packageCount: num,
  packageSize: num,
  packageUnit: str,
  totalWeight: num,
  weightUnit: str,
  totalVolume: num,
  volumeUnit: str,
  totalPrice: num,
  pricePerLb: num,
  pricePerOz: num,
  pricePerItem: num,
  storeName: str,
  storeLocation: str,
  sourceType: z.preprocess(
    (v) => (PRODUCT_SOURCE_TYPES.includes(v as never) ? v : "other"),
    z.enum(PRODUCT_SOURCE_TYPES),
  ),
  lowConfidenceFields: z.array(z.string()).default([]),
  confidence: z.preprocess(
    (v) => (typeof v === "number" && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.5),
    z.number(),
  ),
  notes: str,
});

// POST /api/products/scan — the client uploads a downscaled JPEG/PNG as base64.
export const scanRequestSchema = z.object({
  imageBase64: z.string().min(1).max(20_000_000),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

// A price observation, shared by create and append-price.
const priceFields = {
  totalPrice: z.number().nonnegative().max(100_000),
  currency: z.string().trim().max(8).default("USD"),
  unitPrice: z.number().nonnegative().nullable().optional(),
  unitType: z.string().trim().max(20).nullable().optional(),
  pricePerLb: z.number().nonnegative().nullable().optional(),
  pricePerOz: z.number().nonnegative().nullable().optional(),
  pricePerItem: z.number().nonnegative().nullable().optional(),
  packageCount: z.number().nonnegative().nullable().optional(),
  packageSize: z.number().nonnegative().nullable().optional(),
  packageUnit: z.string().trim().max(20).nullable().optional(),
  storeName: z.string().trim().max(120).nullable().optional(),
  storeLocation: z.string().trim().max(200).nullable().optional(),
  sourceType: z.enum(PRODUCT_SOURCE_TYPES).default("manual"),
  sourceImagePath: z.string().trim().max(400).nullable().optional(),
  recognitionConfidence: z.number().min(0).max(1).nullable().optional(),
  observedAt: z.string().max(40).nullable().optional(),
};

// POST /api/products — create a product and its first price observation.
export const productCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  brand: z.string().trim().max(120).nullable().optional(),
  variant: z.string().trim().max(160).nullable().optional(),
  category: z.string().trim().max(60).nullable().optional(),
  barcode: z.string().trim().max(64).nullable().optional(),
  costcoItemNumber: z.string().trim().max(40).nullable().optional(),
  packageCount: z.number().nonnegative().nullable().optional(),
  packageSize: z.number().nonnegative().nullable().optional(),
  packageUnit: z.string().trim().max(20).nullable().optional(),
  totalWeight: z.number().nonnegative().nullable().optional(),
  weightUnit: z.string().trim().max(20).nullable().optional(),
  totalVolume: z.number().nonnegative().nullable().optional(),
  volumeUnit: z.string().trim().max(20).nullable().optional(),
  standardUnit: z.string().trim().max(20).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  imagePath: z.string().trim().max(400).nullable().optional(),
  price: z.object(priceFields),
});

// POST /api/products/[id]/prices — append a price to an existing product.
export const priceAppendSchema = z.object(priceFields);

// PATCH /api/products/[id] — edit product attributes (no price changes here).
export const productUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    brand: z.string().trim().max(120).nullable().optional(),
    variant: z.string().trim().max(160).nullable().optional(),
    category: z.string().trim().max(60).nullable().optional(),
    barcode: z.string().trim().max(64).nullable().optional(),
    costcoItemNumber: z.string().trim().max(40).nullable().optional(),
    preferredQuantity: z.number().nonnegative().nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
    isFavorite: z.boolean().optional(),
  })
  .refine((p) => Object.keys(p).length > 0, { message: "No fields to update." });

export type ScanRequest = z.infer<typeof scanRequestSchema>;
export type ProductCreate = z.infer<typeof productCreateSchema>;
export type PriceAppend = z.infer<typeof priceAppendSchema>;
export type ProductUpdate = z.infer<typeof productUpdateSchema>;
