// Client-safe types + constants for the "My Costco Products" database — the
// product photo-scanning tool. No server-only imports here.
//
// Single-owner app: these tables carry no user_id; access is gated by owner
// email in RLS, mirroring grocery_items / nutrition_*.

export type DbCostcoProduct = {
  id: string;
  name: string;
  brand: string | null;
  variant: string | null;
  category: string | null;
  barcode: string | null;
  costco_item_number: string | null;
  package_count: number | null;
  package_size: number | null;
  package_unit: string | null;
  total_weight: number | null;
  weight_unit: string | null;
  total_volume: number | null;
  volume_unit: string | null;
  standard_unit: string | null;
  preferred_quantity: number | null;
  notes: string | null;
  image_url: string | null; // storage object path (NOT a public URL)
  is_favorite: boolean;
  times_purchased: number;
  last_purchased_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DbCostcoProductPrice = {
  id: string;
  product_id: string;
  total_price: number;
  currency: string;
  unit_price: number | null;
  unit_type: string | null; // 'lb' | 'oz' | 'item' | 'serving'
  package_count: number | null;
  package_size: number | null;
  package_unit: string | null;
  store_name: string | null;
  store_location: string | null;
  source_type: string | null; // 'package' | 'shelf_label' | 'barcode' | 'receipt' | 'manual'
  source_image_url: string | null; // storage object path of the scan image
  recognition_confidence: number | null;
  is_user_confirmed: boolean;
  observed_at: string;
  created_at: string;
};

// A product row from the costco_products_overview view, enriched with its most
// recent price and a freshly-signed (display-ready) image URL. This is the shape
// the client renders.
export type ProductOverview = DbCostcoProduct & {
  last_total_price: number | null;
  last_unit_price: number | null;
  last_unit_type: string | null;
  last_store_name: string | null;
  last_observed_at: string | null;
  price_count: number;
  imageUrl: string | null; // signed URL, or null when there's no stored image
};

// A single price observation with a signed source-image URL, for the
// price-history view.
export type PriceHistoryEntry = DbCostcoProductPrice & {
  sourceImageUrl: string | null;
};

// What Claude returns for a scanned image. Every field is nullable — recognition
// is never trusted to be complete, and the review screen lets the owner fill or
// correct anything. `lowConfidenceFields` drives the UI highlighting.
export type ScannedProduct = {
  name: string | null;
  brand: string | null;
  variant: string | null;
  category: string | null;
  barcode: string | null;
  costcoItemNumber: string | null;
  packageCount: number | null;
  packageSize: number | null;
  packageUnit: string | null;
  totalWeight: number | null;
  weightUnit: string | null; // 'lb' | 'oz'
  totalVolume: number | null;
  volumeUnit: string | null; // 'fl oz' | 'L' | 'ml' | 'gal'
  totalPrice: number | null;
  pricePerLb: number | null;
  pricePerOz: number | null;
  pricePerItem: number | null;
  storeName: string | null;
  storeLocation: string | null;
  sourceType: ProductSourceType;
  lowConfidenceFields: string[];
  confidence: number;
  notes: string | null;
};

export const PRODUCT_SOURCE_TYPES = [
  "package",
  "shelf_label",
  "barcode",
  "receipt",
  "manual",
  "other",
] as const;
export type ProductSourceType = (typeof PRODUCT_SOURCE_TYPES)[number];

// Computed unit-pricing summary derived from a scan or a manual entry.
export type UnitPricing = {
  unitType: string | null; // the primary "standard unit" for this product
  unitPrice: number | null; // price per primary standard unit
  pricePerLb: number | null;
  pricePerOz: number | null;
  pricePerItem: number | null;
  standardUnit: string | null;
};

// Costco-leaning aisle/category quick-picks. Free-form is allowed too.
export const PRODUCT_CATEGORIES = [
  "Produce",
  "Meat & Seafood",
  "Dairy & Eggs",
  "Frozen",
  "Bakery",
  "Pantry",
  "Snacks",
  "Beverages",
  "Household",
  "Health",
  "Other",
] as const;
