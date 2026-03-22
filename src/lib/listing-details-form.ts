import type { ListingDetails } from "@/lib/listing-details";
import { isCuisineValue } from "@/lib/cuisines";
import { hasListingSchemaField, type ListingSchemaFieldDefinition } from "@/lib/listing-fields";

export const FOOD_OPENING_HOURS_DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday"
] as const;

export type FoodOpeningHoursDayKey = (typeof FOOD_OPENING_HOURS_DAY_KEYS)[number];

export type FoodOpeningHoursIntervalDraft = {
  open: string;
  close: string;
};

export type FoodOpeningHoursWeekDraft = Record<FoodOpeningHoursDayKey, FoodOpeningHoursIntervalDraft[]>;

export const FOOD_OPENING_HOURS_DAY_LABELS: Record<FoodOpeningHoursDayKey, string> = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday"
};

const FOOD_OPENING_HOURS_TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
export const MAX_FOOD_OPENING_INTERVAL_MINUTES = 16 * 60;

function toFoodOpeningHoursMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function getFoodOpeningHoursIntervalDurationMinutes(open: string, close: string) {
  if (!FOOD_OPENING_HOURS_TIME_PATTERN.test(open) || !FOOD_OPENING_HOURS_TIME_PATTERN.test(close)) {
    return null;
  }

  const openMinutes = toFoodOpeningHoursMinutes(open);
  let closeMinutes = toFoodOpeningHoursMinutes(close);

  if (closeMinutes <= openMinutes) {
    closeMinutes += 24 * 60;
  }

  return closeMinutes - openMinutes;
}

export function getFoodOpeningHoursIntervalValidationMessage(open: string, close: string) {
  if (open === close) {
    return "Closing time must be different from opening time";
  }

  const durationMinutes = getFoodOpeningHoursIntervalDurationMinutes(open, close);

  if (durationMinutes === null) {
    return "Invalid opening hours interval";
  }

  if (durationMinutes > MAX_FOOD_OPENING_INTERVAL_MINUTES) {
    return "Intervals cannot be longer than 16 hours";
  }

  return null;
}

export function isValidFoodOpeningHoursInterval(open: string, close: string) {
  return getFoodOpeningHoursIntervalValidationMessage(open, close) === null;
}

export function createEmptyFoodOpeningHoursWeekDraft(): FoodOpeningHoursWeekDraft {
  return {
    sunday: [],
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: []
  };
}

export type ListingDetailsDraft = {
  cuisines: string[];
  openingHoursWeek: FoodOpeningHoursWeekDraft;
  takeaway: boolean;
  priceLevel: "" | "budget" | "mid" | "premium";
  priceFrom: string;
  durationMinutes: string;
  difficulty: "" | "easy" | "moderate" | "hard";
  bookingRequired: boolean;
  accessType: "" | "car" | "walk" | "mixed";
  bestTime: "" | "sunrise" | "daytime" | "sunset" | "night";
  hikeMinutes: string;
  entryFee: string;
  notes: string;
};

export const INITIAL_DETAILS_DRAFT: ListingDetailsDraft = {
  cuisines: [],
  openingHoursWeek: createEmptyFoodOpeningHoursWeekDraft(),
  takeaway: false,
  priceLevel: "",
  priceFrom: "",
  durationMinutes: "",
  difficulty: "",
  bookingRequired: false,
  accessType: "",
  bestTime: "",
  hikeMinutes: "",
  entryFee: "",
  notes: ""
};

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asCuisineValues(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && isCuisineValue(item))
    .filter((item, index, array) => array.indexOf(item) === index);
}

function asBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function asNumberString(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string" && value.trim().length > 0 && Number.isFinite(Number(value))) {
    return value;
  }

  return "";
}

function asFoodOpeningHoursWeekDraft(value: unknown): FoodOpeningHoursWeekDraft {
  const week = createEmptyFoodOpeningHoursWeekDraft();
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return week;
  }

  const rawWeek = value as Record<string, unknown>;

  FOOD_OPENING_HOURS_DAY_KEYS.forEach((dayKey) => {
    const rawIntervals = rawWeek[dayKey];
    if (!Array.isArray(rawIntervals)) {
      return;
    }

    const normalizedIntervals: FoodOpeningHoursIntervalDraft[] = [];

    rawIntervals.forEach((rawInterval) => {
      if (!rawInterval || typeof rawInterval !== "object" || Array.isArray(rawInterval)) {
        return;
      }

      const intervalRecord = rawInterval as Record<string, unknown>;
      const open = asString(intervalRecord.open);
      const close = asString(intervalRecord.close);

      if (
        FOOD_OPENING_HOURS_TIME_PATTERN.test(open) &&
        FOOD_OPENING_HOURS_TIME_PATTERN.test(close) &&
        open !== close
      ) {
        normalizedIntervals.push({ open, close });
      }
    });

    week[dayKey] = normalizedIntervals;
  });

  return week;
}

function toFoodOpeningHoursWeekPayload(
  value: FoodOpeningHoursWeekDraft
): Record<FoodOpeningHoursDayKey, Array<{ open: string; close: string }>> | null {
  const week = createEmptyFoodOpeningHoursWeekDraft();
  let hasIntervals = false;

  FOOD_OPENING_HOURS_DAY_KEYS.forEach((dayKey) => {
    const normalizedIntervals: Array<{ open: string; close: string }> = [];

    value[dayKey].forEach((interval) => {
      const open = interval.open.trim();
      const close = interval.close.trim();

      if (
        FOOD_OPENING_HOURS_TIME_PATTERN.test(open) &&
        FOOD_OPENING_HOURS_TIME_PATTERN.test(close)
      ) {
        normalizedIntervals.push({ open, close });
        hasIntervals = true;
      }
    });

    week[dayKey] = normalizedIntervals;
  });

  return hasIntervals ? week : null;
}

export function toListingDetailsDraft(value: unknown): ListingDetailsDraft {
  const details = asRecord(value);

  const priceLevel = asString(details.priceLevel);
  const difficulty = asString(details.difficulty);
  const accessType = asString(details.accessType);
  const bestTime = asString(details.bestTime);

  return {
    cuisines: asCuisineValues(details.cuisines),
    openingHoursWeek: asFoodOpeningHoursWeekDraft(details.openingHoursWeek),
    takeaway: asBoolean(details.takeaway),
    priceLevel:
      priceLevel === "budget" || priceLevel === "mid" || priceLevel === "premium" ? priceLevel : "",
    priceFrom: asNumberString(details.priceFrom),
    durationMinutes: asNumberString(details.durationMinutes),
    difficulty:
      difficulty === "easy" || difficulty === "moderate" || difficulty === "hard"
        ? difficulty
        : "",
    bookingRequired: asBoolean(details.bookingRequired),
    accessType: accessType === "car" || accessType === "walk" || accessType === "mixed" ? accessType : "",
    bestTime:
      bestTime === "sunrise" ||
      bestTime === "daytime" ||
      bestTime === "sunset" ||
      bestTime === "night"
        ? bestTime
        : "",
    hikeMinutes: asNumberString(details.hikeMinutes),
    entryFee: asNumberString(details.entryFee),
    notes: asString(details.notes)
  };
}

function pushIfString(
  target: ListingDetails,
  key: string,
  value: string
) {
  const normalized = value.trim();
  if (normalized.length > 0) {
    target[key] = normalized;
  }
}

function pushIfNumber(target: ListingDetails, key: string, value: string) {
  const normalized = value.trim();
  if (normalized.length === 0) {
    return;
  }

  const numeric = Number(normalized);
  if (Number.isFinite(numeric)) {
    target[key] = numeric;
  }
}

export function toListingDetailsPayload(
  schemaFields: ListingSchemaFieldDefinition[],
  draft: ListingDetailsDraft
): ListingDetails {
  const details: ListingDetails = {};

  if (hasListingSchemaField(schemaFields, "cuisines") && draft.cuisines.length > 0) {
    details.cuisines = draft.cuisines;
  }

  if (hasListingSchemaField(schemaFields, "openingHours")) {
    const openingHoursWeek = toFoodOpeningHoursWeekPayload(draft.openingHoursWeek);
    if (openingHoursWeek) {
      details.openingHoursWeek = openingHoursWeek;
    }
  }

  if (hasListingSchemaField(schemaFields, "takeaway")) {
    details.takeaway = draft.takeaway;
  }

  if (hasListingSchemaField(schemaFields, "priceLevel") && draft.priceLevel) {
    details.priceLevel = draft.priceLevel;
  }

  if (hasListingSchemaField(schemaFields, "priceFrom")) {
    pushIfNumber(details, "priceFrom", draft.priceFrom);
  }

  if (hasListingSchemaField(schemaFields, "durationMinutes")) {
    pushIfNumber(details, "durationMinutes", draft.durationMinutes);
  }

  if (hasListingSchemaField(schemaFields, "difficulty") && draft.difficulty) {
    details.difficulty = draft.difficulty;
  }

  if (hasListingSchemaField(schemaFields, "bookingRequired")) {
    details.bookingRequired = draft.bookingRequired;
  }

  if (hasListingSchemaField(schemaFields, "accessType") && draft.accessType) {
    details.accessType = draft.accessType;
  }

  if (hasListingSchemaField(schemaFields, "bestTime") && draft.bestTime) {
    details.bestTime = draft.bestTime;
  }

  if (hasListingSchemaField(schemaFields, "hikeMinutes")) {
    pushIfNumber(details, "hikeMinutes", draft.hikeMinutes);
  }

  if (hasListingSchemaField(schemaFields, "entryFee")) {
    pushIfNumber(details, "entryFee", draft.entryFee);
  }

  if (hasListingSchemaField(schemaFields, "notes")) {
    pushIfString(details, "notes", draft.notes);
  }

  return details;
}
