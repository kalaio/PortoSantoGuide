import type { ListingSchemaFieldDefinition } from "@/lib/listing-fields";
import { hasListingSchemaField, isRequiredListingSchemaField } from "@/lib/listing-fields";

type SchemaValidationIssue = {
  path: Array<string | number>;
  message: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function isFilledString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPresentNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value);
}

function hasOpeningHours(value: unknown) {
  const details = asRecord(value);
  const week = asRecord(details.openingHoursWeek);

  return Object.values(week).some((dayValue) => Array.isArray(dayValue) && dayValue.length > 0);
}

function hasCuisineValues(value: unknown) {
  const details = asRecord(value);
  return Array.isArray(details.cuisines) && details.cuisines.length > 0;
}

function hasBooleanField(value: unknown, key: string) {
  const details = asRecord(value);
  return typeof details[key] === "boolean";
}

function hasStringField(value: unknown, key: string) {
  const details = asRecord(value);
  return isFilledString(details[key]);
}

function hasNumberField(value: unknown, key: string) {
  const details = asRecord(value);
  return isPresentNumber(details[key]);
}

export function validateListingPayloadAgainstSchemaFields({
  description,
  latitude,
  longitude,
  details,
  schemaFields
}: {
  description: string | null | undefined;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  details: unknown;
  schemaFields: ListingSchemaFieldDefinition[];
}): SchemaValidationIssue[] {
  const issues: SchemaValidationIssue[] = [];

  if (isRequiredListingSchemaField(schemaFields, "description") && !isFilledString(description)) {
    issues.push({ path: ["description"], message: "Description is required" });
  }

  if (hasListingSchemaField(schemaFields, "location")) {
    const hasLocation = isPresentNumber(latitude) && isPresentNumber(longitude);

    if (isRequiredListingSchemaField(schemaFields, "location") && !hasLocation) {
      issues.push({ path: ["latitude"], message: "Location is required" });
      issues.push({ path: ["longitude"], message: "Location is required" });
    }
  }

  if (isRequiredListingSchemaField(schemaFields, "cuisines") && !hasCuisineValues(details)) {
    issues.push({ path: ["details", "cuisines"], message: "Select at least one cuisine" });
  }

  if (isRequiredListingSchemaField(schemaFields, "openingHours") && !hasOpeningHours(details)) {
    issues.push({ path: ["details", "openingHoursWeek"], message: "Opening hours are required" });
  }

  if (isRequiredListingSchemaField(schemaFields, "notes") && !hasStringField(details, "notes")) {
    issues.push({ path: ["details", "notes"], message: "Notes are required" });
  }

  if (isRequiredListingSchemaField(schemaFields, "priceLevel") && !hasStringField(details, "priceLevel")) {
    issues.push({ path: ["details", "priceLevel"], message: "Price level is required" });
  }

  if (isRequiredListingSchemaField(schemaFields, "priceFrom") && !hasNumberField(details, "priceFrom")) {
    issues.push({ path: ["details", "priceFrom"], message: "Price from is required" });
  }

  if (isRequiredListingSchemaField(schemaFields, "durationMinutes") && !hasNumberField(details, "durationMinutes")) {
    issues.push({ path: ["details", "durationMinutes"], message: "Duration is required" });
  }

  if (isRequiredListingSchemaField(schemaFields, "difficulty") && !hasStringField(details, "difficulty")) {
    issues.push({ path: ["details", "difficulty"], message: "Difficulty is required" });
  }

  if (isRequiredListingSchemaField(schemaFields, "bookingRequired") && !hasBooleanField(details, "bookingRequired")) {
    issues.push({ path: ["details", "bookingRequired"], message: "Booking requirement must be defined" });
  }

  if (isRequiredListingSchemaField(schemaFields, "takeaway") && !hasBooleanField(details, "takeaway")) {
    issues.push({ path: ["details", "takeaway"], message: "Takeaway availability must be defined" });
  }

  if (isRequiredListingSchemaField(schemaFields, "accessType") && !hasStringField(details, "accessType")) {
    issues.push({ path: ["details", "accessType"], message: "Access type is required" });
  }

  if (isRequiredListingSchemaField(schemaFields, "bestTime") && !hasStringField(details, "bestTime")) {
    issues.push({ path: ["details", "bestTime"], message: "Best time is required" });
  }

  if (isRequiredListingSchemaField(schemaFields, "hikeMinutes") && !hasNumberField(details, "hikeMinutes")) {
    issues.push({ path: ["details", "hikeMinutes"], message: "Walking time is required" });
  }

  if (isRequiredListingSchemaField(schemaFields, "entryFee") && !hasNumberField(details, "entryFee")) {
    issues.push({ path: ["details", "entryFee"], message: "Entry fee is required" });
  }

  return issues;
}
