export type ListingFieldComponent =
  | "text"
  | "textarea"
  | "number"
  | "checkbox"
  | "select"
  | "multiselect"
  | "location"
  | "opening-hours";

export type ListingFieldDefinition = {
  key: string;
  label: string;
  description: string;
  component: ListingFieldComponent;
  supportsFrontendFilter?: boolean;
};

export type ListingSchemaFieldDefinition = {
  fieldKey: string;
  sortOrder: number;
  isRequired: boolean;
  isFrontendFilterEnabled?: boolean;
};

export const LISTING_FIELDS: ListingFieldDefinition[] = [
  {
    key: "description",
    label: "Description",
    description: "Long-form editorial description or overview text.",
    component: "textarea"
  },
  {
    key: "notes",
    label: "Notes",
    description: "Generic notes or extra operational context.",
    component: "textarea"
  },
  {
    key: "location",
    label: "Location",
    description: "Latitude, longitude, and map-based position picker.",
    component: "location"
  },
  {
    key: "openingHours",
    label: "Opening hours",
    description: "Weekly opening and closing schedule.",
    component: "opening-hours",
    supportsFrontendFilter: true
  },
  {
    key: "cuisines",
    label: "Cuisines",
    description: "Multi-select cuisine classification used in filters.",
    component: "multiselect",
    supportsFrontendFilter: true
  },
  {
    key: "priceLevel",
    label: "Price level",
    description: "Budget / mid / premium price band.",
    component: "select",
    supportsFrontendFilter: true
  },
  {
    key: "priceFrom",
    label: "Price from",
    description: "Starting price in EUR.",
    component: "number"
  },
  {
    key: "takeaway",
    label: "Takeaway",
    description: "Whether takeaway is available.",
    component: "checkbox"
  },
  {
    key: "durationMinutes",
    label: "Duration",
    description: "Estimated duration in minutes.",
    component: "number"
  },
  {
    key: "difficulty",
    label: "Difficulty",
    description: "Difficulty level for activities.",
    component: "select"
  },
  {
    key: "bookingRequired",
    label: "Booking required",
    description: "Whether booking is needed before attending.",
    component: "checkbox"
  },
  {
    key: "accessType",
    label: "Access type",
    description: "How the location is accessed.",
    component: "select"
  },
  {
    key: "bestTime",
    label: "Best time",
    description: "Best time of day to visit.",
    component: "select"
  },
  {
    key: "hikeMinutes",
    label: "Walking time",
    description: "Walking time in minutes.",
    component: "number"
  },
  {
    key: "entryFee",
    label: "Entry fee",
    description: "Entry price in EUR.",
    component: "number"
  }
];

export const LISTING_FIELD_KEYS = LISTING_FIELDS.map((field) => field.key);

const LISTING_FIELD_MAP = new Map(LISTING_FIELDS.map((field) => [field.key, field]));
const LISTING_FIELD_KEY_SET = new Set(LISTING_FIELD_KEYS);

export function getListingFieldByKey(key: string) {
  return LISTING_FIELD_MAP.get(key) ?? null;
}

export function isListingFieldKey(key: string): key is (typeof LISTING_FIELD_KEYS)[number] {
  return LISTING_FIELD_KEY_SET.has(key);
}

export function hasListingSchemaField(fields: ListingSchemaFieldDefinition[], fieldKey: string) {
  return fields.some((field) => field.fieldKey === fieldKey);
}

export function isRequiredListingSchemaField(fields: ListingSchemaFieldDefinition[], fieldKey: string) {
  return fields.some((field) => field.fieldKey === fieldKey && field.isRequired);
}

export function isFrontendFilterEnabledListingSchemaField(
  fields: ListingSchemaFieldDefinition[],
  fieldKey: string
) {
  return fields.some((field) => field.fieldKey === fieldKey && field.isFrontendFilterEnabled);
}

export function getListingFieldDataKey(fieldKey: string) {
  switch (fieldKey) {
    case "openingHours":
      return "openingHoursWeek";
    default:
      return fieldKey;
  }
}
