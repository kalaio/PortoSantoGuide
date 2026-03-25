import { getCuisineLabel, isCuisineValue } from "@/lib/cuisines";
import type { ListingSchemaFieldSummary } from "@/types/listing";

export type ListingDetails = Record<string, unknown>;

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

export type FoodOpeningHoursInterval = {
  open: string;
  close: string;
};

export type FoodOpeningHoursWeek = Record<FoodOpeningHoursDayKey, FoodOpeningHoursInterval[]>;
export type FoodOpeningState = "open" | "closed";

export const FOOD_OPENING_HOURS_DAY_LABELS: Record<FoodOpeningHoursDayKey, string> = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday"
};

const FOOD_OPENING_HOURS_TIME_ZONE = "Atlantic/Madeira";
const FOOD_OPENING_HOURS_TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const ENGLISH_WEEKDAY_TO_FOOD_DAY_KEY: Record<string, FoodOpeningHoursDayKey> = {
  sunday: "sunday",
  monday: "monday",
  tuesday: "tuesday",
  wednesday: "wednesday",
  thursday: "thursday",
  friday: "friday",
  saturday: "saturday"
};

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  return null;
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  return null;
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

export function getFoodCuisineValues(value: unknown): string[] {
  const details = asRecord(value);

  return asCuisineValues(details.cuisines);
}

export function getFoodCuisineLabels(value: unknown): string[] {
  return getFoodCuisineValues(value).map((cuisine) => getCuisineLabel(cuisine));
}

function createEmptyFoodOpeningHoursWeek(): FoodOpeningHoursWeek {
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

function toDayMinutes(timeValue: string): number {
  const [hours, minutes] = timeValue.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatCurrentDayTimeInFoodTimeZone(now: Date): { dayKey: FoodOpeningHoursDayKey; minutes: number } | null {
  const weekdayName = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: FOOD_OPENING_HOURS_TIME_ZONE
  })
    .format(now)
    .toLowerCase();

  const dayKey = ENGLISH_WEEKDAY_TO_FOOD_DAY_KEY[weekdayName];
  if (!dayKey) {
    return null;
  }

  const currentTime = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: FOOD_OPENING_HOURS_TIME_ZONE
  }).format(now);

  if (!FOOD_OPENING_HOURS_TIME_PATTERN.test(currentTime)) {
    return null;
  }

  return {
    dayKey,
    minutes: toDayMinutes(currentTime)
  };
}

export function getFoodOpeningHoursWeek(value: unknown): FoodOpeningHoursWeek | null {
  const details = asRecord(value);
  const rawWeek = details.openingHoursWeek;
  if (!rawWeek || typeof rawWeek !== "object" || Array.isArray(rawWeek)) {
    return null;
  }

  const weekRecord = rawWeek as Record<string, unknown>;
  const week = createEmptyFoodOpeningHoursWeek();
  let hasStructuredSchedule = false;

  FOOD_OPENING_HOURS_DAY_KEYS.forEach((dayKey) => {
    const rawIntervals = weekRecord[dayKey];
    if (!Array.isArray(rawIntervals)) {
      return;
    }

    hasStructuredSchedule = true;
    const normalizedIntervals: FoodOpeningHoursInterval[] = [];

    rawIntervals.forEach((rawInterval) => {
      const intervalRecord = asRecord(rawInterval);
      const open = asString(intervalRecord.open);
      const close = asString(intervalRecord.close);

      if (
        open &&
        close &&
        FOOD_OPENING_HOURS_TIME_PATTERN.test(open) &&
        FOOD_OPENING_HOURS_TIME_PATTERN.test(close) &&
        open !== close
      ) {
        normalizedIntervals.push({ open, close });
      }
    });

    week[dayKey] = normalizedIntervals;
  });

  return hasStructuredSchedule ? week : null;
}

export function formatFoodOpeningIntervals(intervals: FoodOpeningHoursInterval[]): string {
  return intervals.map((interval) => `${interval.open} - ${interval.close}`).join(" · ");
}

function getEarliestOpenTime(intervals: FoodOpeningHoursInterval[]): string | null {
  let earliestMinutes = Number.POSITIVE_INFINITY;
  let earliestOpenTime: string | null = null;

  intervals.forEach((interval) => {
    const openMinutes = toDayMinutes(interval.open);
    if (openMinutes < earliestMinutes) {
      earliestMinutes = openMinutes;
      earliestOpenTime = interval.open;
    }
  });

  return earliestOpenTime;
}

type FoodOpeningResolution =
  | { state: "open"; closesAt: string }
  | {
      state: "closed";
      nextOpening: {
        dayOffset: number;
        dayKey: FoodOpeningHoursDayKey;
        openAt: string;
      } | null;
    };

function resolveFoodOpeningState(
  value: unknown,
  now: Date = new Date()
): FoodOpeningResolution | null {
  const week = getFoodOpeningHoursWeek(value);
  if (!week) {
    return null;
  }

  const currentMoment = formatCurrentDayTimeInFoodTimeZone(now);
  if (!currentMoment) {
    return null;
  }

  const currentDayIndex = FOOD_OPENING_HOURS_DAY_KEYS.indexOf(currentMoment.dayKey);
  const previousDayKey = FOOD_OPENING_HOURS_DAY_KEYS[(currentDayIndex + FOOD_OPENING_HOURS_DAY_KEYS.length - 1) %
    FOOD_OPENING_HOURS_DAY_KEYS.length];

  for (const interval of week[previousDayKey]) {
    const openMinutes = toDayMinutes(interval.open);
    const closeMinutes = toDayMinutes(interval.close);

    if (openMinutes > closeMinutes && currentMoment.minutes < closeMinutes) {
      return { state: "open", closesAt: interval.close };
    }
  }

  for (const interval of week[currentMoment.dayKey]) {
    const openMinutes = toDayMinutes(interval.open);
    const closeMinutes = toDayMinutes(interval.close);

    if (openMinutes < closeMinutes && currentMoment.minutes >= openMinutes && currentMoment.minutes < closeMinutes) {
      return { state: "open", closesAt: interval.close };
    }

    if (openMinutes > closeMinutes && currentMoment.minutes >= openMinutes) {
      return { state: "open", closesAt: interval.close };
    }
  }

  const sameDayFutureOpenTimes = week[currentMoment.dayKey]
    .map((interval) => interval.open)
    .filter((openTime) => toDayMinutes(openTime) > currentMoment.minutes)
    .sort();

  if (sameDayFutureOpenTimes.length > 0) {
    return {
      state: "closed",
      nextOpening: {
        dayOffset: 0,
        dayKey: currentMoment.dayKey,
        openAt: sameDayFutureOpenTimes[0]
      }
    };
  }

  for (let dayOffset = 1; dayOffset <= FOOD_OPENING_HOURS_DAY_KEYS.length; dayOffset += 1) {
    const nextDayKey =
      FOOD_OPENING_HOURS_DAY_KEYS[(currentDayIndex + dayOffset) % FOOD_OPENING_HOURS_DAY_KEYS.length];
    const earliestOpenTime = getEarliestOpenTime(week[nextDayKey]);

    if (earliestOpenTime) {
      return {
        state: "closed",
        nextOpening: {
          dayOffset,
          dayKey: nextDayKey,
          openAt: earliestOpenTime
        }
      };
    }
  }

  return { state: "closed", nextOpening: null };
}

export function getFoodOpeningState(value: unknown, now: Date = new Date()): FoodOpeningState | null {
  return resolveFoodOpeningState(value, now)?.state ?? null;
}

export function hasSchemaField(fields: ListingSchemaFieldSummary[] | null | undefined, fieldKey: string) {
  return (fields ?? []).some((field) => field.fieldKey === fieldKey);
}

export function getFoodOpeningStatus(value: unknown, now: Date = new Date()): string | null {
  const resolved = resolveFoodOpeningState(value, now);
  if (!resolved) {
    return null;
  }

  if (resolved.state === "open") {
    return `Open until ${resolved.closesAt}`;
  }

  if (resolved.nextOpening) {
    if (resolved.nextOpening.dayOffset === 0) {
      return `Closed · Open today at ${resolved.nextOpening.openAt}`;
    }

    if (resolved.nextOpening.dayOffset === 1) {
      return `Closed · Open tomorrow at ${resolved.nextOpening.openAt}`;
    }

    return `Closed · Open ${FOOD_OPENING_HOURS_DAY_LABELS[resolved.nextOpening.dayKey]} at ${resolved.nextOpening.openAt}`;
  }

  return "Closed";
}

export function toListingDetails(value: unknown): ListingDetails {
  return asRecord(value);
}

function getFieldSummary(fieldKey: string, details: Record<string, unknown>) {
  switch (fieldKey) {
    case "cuisines": {
      const cuisineLabels = getFoodCuisineLabels(details);
      return cuisineLabels.length > 0 ? cuisineLabels.join(", ") : null;
    }
    case "openingHours": {
      const openingStatus = getFoodOpeningStatus(details);
      return openingStatus && openingStatus !== "Closed" ? openingStatus : null;
    }
    case "priceFrom": {
      const priceFrom = asNumber(details.priceFrom);
      return typeof priceFrom === "number" ? `From EUR ${Math.round(priceFrom)}` : null;
    }
    case "priceLevel": {
      const priceLevel = asString(details.priceLevel);
      return priceLevel ? `Price ${priceLevel}` : null;
    }
    case "takeaway": {
      return asBoolean(details.takeaway) === true ? "Takeaway" : null;
    }
    case "durationMinutes": {
      const durationMinutes = asNumber(details.durationMinutes);
      return typeof durationMinutes === "number" ? `${durationMinutes} min` : null;
    }
    case "difficulty": {
      return asString(details.difficulty);
    }
    case "bookingRequired": {
      return asBoolean(details.bookingRequired) === true ? "Booking required" : null;
    }
    case "accessType": {
      return asString(details.accessType);
    }
    case "bestTime": {
      return asString(details.bestTime);
    }
    case "hikeMinutes": {
      const hikeMinutes = asNumber(details.hikeMinutes);
      return typeof hikeMinutes === "number" ? `${hikeMinutes} min walk` : null;
    }
    case "entryFee": {
      const entryFee = asNumber(details.entryFee);
      if (typeof entryFee !== "number") {
        return null;
      }

      return entryFee > 0 ? `EUR ${Math.round(entryFee)}` : "Free";
    }
    default:
      return null;
  }
}

function getFieldEntry(fieldKey: string, details: Record<string, unknown>): { label: string; value: string } | null {
  switch (fieldKey) {
    case "cuisines": {
      const cuisineLabels = getFoodCuisineLabels(details);
      return cuisineLabels.length > 0 ? { label: "Cuisines", value: cuisineLabels.join(" · ") } : null;
    }
    case "takeaway": {
      const takeaway = asBoolean(details.takeaway);
      return takeaway !== null ? { label: "Takeaway", value: takeaway ? "Yes" : "No" } : null;
    }
    case "priceLevel": {
      const priceLevel = asString(details.priceLevel);
      return priceLevel ? { label: "Price level", value: priceLevel } : null;
    }
    case "priceFrom": {
      const priceFrom = asNumber(details.priceFrom);
      return typeof priceFrom === "number" ? { label: "Price from", value: `EUR ${Math.round(priceFrom)}` } : null;
    }
    case "durationMinutes": {
      const durationMinutes = asNumber(details.durationMinutes);
      return typeof durationMinutes === "number" ? { label: "Duration", value: `${durationMinutes} minutes` } : null;
    }
    case "difficulty": {
      const difficulty = asString(details.difficulty);
      return difficulty ? { label: "Difficulty", value: difficulty } : null;
    }
    case "bookingRequired": {
      const bookingRequired = asBoolean(details.bookingRequired);
      return bookingRequired !== null
        ? { label: "Booking", value: bookingRequired ? "Required" : "Optional" }
        : null;
    }
    case "accessType": {
      const accessType = asString(details.accessType);
      return accessType ? { label: "Access", value: accessType } : null;
    }
    case "bestTime": {
      const bestTime = asString(details.bestTime);
      return bestTime ? { label: "Best time", value: bestTime } : null;
    }
    case "hikeMinutes": {
      const hikeMinutes = asNumber(details.hikeMinutes);
      return typeof hikeMinutes === "number" ? { label: "Walking time", value: `${hikeMinutes} minutes` } : null;
    }
    case "entryFee": {
      const entryFee = asNumber(details.entryFee);
      return typeof entryFee === "number"
        ? { label: "Entry fee", value: entryFee > 0 ? `EUR ${Math.round(entryFee)}` : "Free" }
        : null;
    }
    case "notes": {
      const notes = asString(details.notes);
      return notes ? { label: "Notes", value: notes } : null;
    }
    default:
      return null;
  }
}

export function getDetailsSummaryByFields(fields: ListingSchemaFieldSummary[] | null | undefined, value: unknown): string {
  const details = asRecord(value);
  const chunks = (fields ?? [])
    .map((field) => getFieldSummary(field.fieldKey, details))
    .filter((chunk): chunk is string => Boolean(chunk));

  return chunks.join(" · ");
}

export function getDetailsEntriesByFields(
  fields: ListingSchemaFieldSummary[] | null | undefined,
  value: unknown
): Array<{ label: string; value: string }> {
  const details = asRecord(value);

  return (fields ?? [])
    .map((field) => getFieldEntry(field.fieldKey, details))
    .filter((entry): entry is { label: string; value: string } => entry !== null);
}
