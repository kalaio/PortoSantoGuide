export type CuisineOption = {
  value: string;
  label: string;
};

export const CUISINE_OPTIONS: CuisineOption[] = [
  { value: "local-madeiran", label: "Local / Madeiran" },
  { value: "portuguese", label: "Portuguese" },
  { value: "seafood", label: "Seafood" },
  { value: "pizza", label: "Pizza" },
  { value: "burger", label: "Burgers" },
  { value: "grill", label: "Grill" },
  { value: "steakhouse", label: "Steakhouse" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "italian", label: "Italian" },
  { value: "cafe", label: "Cafe" },
  { value: "bakery", label: "Bakery" },
  { value: "bar-snacks", label: "Bar Snacks" },
  { value: "desserts", label: "Desserts" },
  { value: "ice-cream", label: "Ice Cream" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "international", label: "International" }
];

export const CUISINE_VALUES = CUISINE_OPTIONS.map((option) => option.value);

const CUISINE_LABELS = new Map(CUISINE_OPTIONS.map((option) => [option.value, option.label]));
const CUISINE_VALUES_SET = new Set(CUISINE_VALUES);

export function isCuisineValue(value: string): value is (typeof CUISINE_VALUES)[number] {
  return CUISINE_VALUES_SET.has(value);
}

export function getCuisineLabel(value: string) {
  return CUISINE_LABELS.get(value) ?? value;
}
