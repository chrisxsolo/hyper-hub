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
  // Current-nutrition summary (from the single is_current version, if any).
  nutrition_version_id: string | null;
  n_calories: number | null;
  n_protein_g: number | null;
  n_serving_desc: string | null;
  n_serving_value: number | null;
  n_serving_unit: string | null;
  n_servings_per_container: number | null;
  has_nutrition: boolean;
  primary_image_url: string | null; // object path of the primary/most-recent image
  imageUrl: string | null; // signed URL, or null when there's no stored image
};

// The image types we track for a product (typed scans/photos).
export const NUTRITION_IMAGE_TYPES = [
  "product_front",
  "product_back",
  "barcode",
  "price_label",
  "nutrition_label",
  "receipt",
  "other",
] as const;
export type ProductImageType = (typeof NUTRITION_IMAGE_TYPES)[number];

export type DbCostcoProductImage = {
  id: string;
  product_id: string;
  image_type: ProductImageType;
  image_url: string; // storage object path (NOT a public URL)
  is_primary: boolean;
  created_at: string;
};

// A product image with a freshly-signed display URL.
export type ProductImageEntry = DbCostcoProductImage & {
  signedUrl: string | null;
};

export type AdditionalNutrient = { name: string; value: number | null; unit: string | null };

// One canonical, versioned nutrition record for a product. Numeric values are
// stored in the label's standard units (g for macros, mg for sodium/minerals,
// mcg for vitamin D); `additional_nutrients` keeps value+unit separately.
export type DbCostcoProductNutritionVersion = {
  id: string;
  product_id: string;

  serving_size_description: string | null;
  serving_size_value: number | null;
  serving_size_unit: string | null;
  servings_per_container: number | null;

  calories: number | null;
  total_fat_g: number | null;
  saturated_fat_g: number | null;
  trans_fat_g: number | null;
  cholesterol_mg: number | null;
  sodium_mg: number | null;
  total_carbohydrate_g: number | null;
  dietary_fiber_g: number | null;
  total_sugars_g: number | null;
  added_sugars_g: number | null;
  protein_g: number | null;

  vitamin_d_mcg: number | null;
  calcium_mg: number | null;
  iron_mg: number | null;
  potassium_mg: number | null;

  additional_nutrients: AdditionalNutrient[] | null;

  source_image_url: string | null; // object path of the label scan
  recognition_confidence: Record<string, number> | null; // per-field 0–1 map
  notes: string | null;
  is_user_confirmed: boolean;
  is_current: boolean;
  observed_at: string;
  created_at: string;
};

// A nutrition version with a signed source-image URL (version-history view).
export type NutritionVersionEntry = DbCostcoProductNutritionVersion & {
  sourceImageUrl: string | null;
};

// What Claude returns for a scanned nutrition-facts label. Every field is
// nullable — recognition is never trusted to be complete, and the review screen
// lets the owner fill or correct anything. `lowConfidenceFields` drives the UI
// highlighting (use the exact camelCase property names).
export type ScannedNutrition = {
  servingSizeDescription: string | null;
  servingSizeValue: number | null;
  servingSizeUnit: string | null;
  servingsPerContainer: number | null;
  calories: number | null;
  totalFatG: number | null;
  saturatedFatG: number | null;
  transFatG: number | null;
  cholesterolMg: number | null;
  sodiumMg: number | null;
  totalCarbohydrateG: number | null;
  dietaryFiberG: number | null;
  totalSugarsG: number | null;
  addedSugarsG: number | null;
  proteinG: number | null;
  vitaminDMcg: number | null;
  calciumMg: number | null;
  ironMg: number | null;
  potassiumMg: number | null;
  additionalNutrients: AdditionalNutrient[];
  lowConfidenceFields: string[];
  confidence: number;
  notes: string | null;
};

// A product surfaced in the calorie-tracker food library ("Costco Products"
// tab): product identity + latest price + the full current nutrition version,
// so the serving-entry sheet can preview scaled nutrients instantly.
export type FoodLibraryEntry = {
  productId: string;
  name: string;
  brand: string | null;
  variant: string | null;
  category: string | null;
  imageUrl: string | null;
  isFavorite: boolean;
  lastTotalPrice: number | null;
  packageCount: number | null;
  totalWeight: number | null;
  weightUnit: string | null;
  nutrition: DbCostcoProductNutritionVersion;
};

// Derived value metrics for a product (price ↔ nutrition). Every field is null
// when its required inputs are missing — we never invent a value (spec §13).
export type ProductValueMetrics = {
  servingsPerPackage: number | null;
  costPerServing: number | null;
  costPerItem: number | null;
  caloriesPerDollar: number | null;
  proteinPerDollar: number | null; // grams of protein per dollar
  proteinPer100Cal: number | null; // grams of protein per 100 calories
  costPerGramProtein: number | null;
  packageCalories: number | null;
  packageProtein: number | null;
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
