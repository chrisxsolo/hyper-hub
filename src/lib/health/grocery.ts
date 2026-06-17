// Client-safe types + constants for the grocery_items table (the grocery list
// tool). No server-only imports here.

export type DbGroceryItem = {
  id: string;
  name: string;
  quantity: string | null;
  category: string | null;
  checked: boolean;
  position: number;
  product_id: string | null;
  created_at: string;
  updated_at: string;
};

// Compact preview of the canonical product a grocery item references, so the
// list can show price + nutrition without copying it. Built server-side from
// costco_products_overview (image URL freshly signed).
export type GroceryProductPreview = {
  id: string;
  brand: string | null;
  category: string | null;
  imageUrl: string | null; // signed URL, or null
  last_total_price: number | null;
  last_unit_price: number | null;
  last_unit_type: string | null;
  package_summary: string | null; // e.g. "6.5 lb", "18 ct"
  nutrition_version_id: string | null;
  n_calories: number | null;
  n_protein_g: number | null;
  n_serving_desc: string | null;
  last_purchased_at: string | null;
};

// A grocery row plus its optional canonical-product preview.
export type GroceryItemView = DbGroceryItem & {
  product: GroceryProductPreview | null;
};

// Common grocery aisles — used to optionally group items. Free-form is allowed
// too; these are just quick-pick suggestions.
export const GROCERY_CATEGORIES = [
  "Produce",
  "Meat & Seafood",
  "Dairy & Eggs",
  "Frozen",
  "Bakery",
  "Pantry",
  "Snacks",
  "Beverages",
  "Household",
  "Other",
] as const;
