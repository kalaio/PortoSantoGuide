import { z } from "zod";
import { CUISINE_VALUES } from "@/lib/cuisines";
import {
  getListingFieldDataKey,
  hasListingSchemaField,
  type ListingSchemaFieldDefinition
} from "@/lib/listing-fields";
import { getFoodOpeningHoursIntervalValidationMessage } from "@/lib/listing-details-form";

const nonEmptyString = z.string().trim().min(1);
const openingHoursTimeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);

const foodOpeningHoursIntervalSchema = z
  .object({
    open: openingHoursTimeSchema,
    close: openingHoursTimeSchema
  })
  .strict()
  .superRefine((value, context) => {
    const validationMessage = getFoodOpeningHoursIntervalValidationMessage(value.open, value.close);

    if (validationMessage) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["close"],
        message: validationMessage
      });
    }
  });

const foodOpeningHoursDaySchema = z.array(foodOpeningHoursIntervalSchema).max(6);

const foodOpeningHoursWeekSchema = z
  .object({
    sunday: foodOpeningHoursDaySchema.optional(),
    monday: foodOpeningHoursDaySchema.optional(),
    tuesday: foodOpeningHoursDaySchema.optional(),
    wednesday: foodOpeningHoursDaySchema.optional(),
    thursday: foodOpeningHoursDaySchema.optional(),
    friday: foodOpeningHoursDaySchema.optional(),
    saturday: foodOpeningHoursDaySchema.optional()
  })
  .strict();

const DETAIL_FIELD_SCHEMAS = {
  cuisines: z.array(z.enum(CUISINE_VALUES as [string, ...string[]])).max(6),
  openingHoursWeek: foodOpeningHoursWeekSchema,
  takeaway: z.boolean(),
  priceLevel: z.enum(["budget", "mid", "premium"]),
  priceFrom: z.number().int().min(0),
  durationMinutes: z.number().int().min(1),
  difficulty: z.enum(["easy", "moderate", "hard"]),
  bookingRequired: z.boolean(),
  accessType: z.enum(["car", "walk", "mixed"]),
  bestTime: z.enum(["sunrise", "daytime", "sunset", "night"]),
  hikeMinutes: z.number().int().min(0),
  entryFee: z.number().int().min(0),
  notes: nonEmptyString.max(500)
} as const;

export function parseDetailsBySchemaFields(schemaFields: ListingSchemaFieldDefinition[], value: unknown) {
  const shape: Record<string, z.ZodTypeAny> = {};

  schemaFields.forEach((field) => {
    const detailKey = getListingFieldDataKey(field.fieldKey);
    const fieldSchema = DETAIL_FIELD_SCHEMAS[detailKey as keyof typeof DETAIL_FIELD_SCHEMAS];

    if (fieldSchema) {
      shape[detailKey] = fieldSchema.optional();
    }
  });

  const dynamicSchema = z
    .object(shape)
    .strict()
    .superRefine((details, context) => {
      if (hasListingSchemaField(schemaFields, "cuisines") && details.cuisines !== undefined && details.cuisines.length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cuisines"],
          message: "Select at least one cuisine"
        });
      }
    });

  return dynamicSchema.safeParse(value);
}

export function normalizeDetailsIssues(issues: z.ZodIssue[]): Array<{ path: Array<string | number>; message: string }> {
  return issues.map((issue) => ({
    path: ["details", ...issue.path],
    message: issue.message
  }));
}
