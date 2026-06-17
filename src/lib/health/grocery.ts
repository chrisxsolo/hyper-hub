// Client-safe types + constants for the grocery_items table (the Costco list
// tool). No server-only imports here.

export type DbGroceryItem = {
  id: string;
  name: string;
  quantity: string | null;
  category: string | null;
  checked: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

// Common Costco aisles — used to optionally group items. Free-form is allowed
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
