import { ListingStatus } from "@prisma/client";
import { z } from "zod";

const latitudeSchema = z.number().min(-90).max(90);
const longitudeSchema = z.number().min(-180).max(180);

export const listQuerySchema = z.object({
  category: z.string().trim().min(2).max(80).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

const categoryIdSchema = z.string().trim().min(1).max(64);

const listingBaseSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(3).max(120),
  status: z.nativeEnum(ListingStatus),
  description: z.string().trim().min(10).max(2500).nullable().optional(),
  latitude: latitudeSchema.nullable().optional(),
  longitude: longitudeSchema.nullable().optional(),
  details: z.record(z.string(), z.unknown()),
  primaryCategoryId: categoryIdSchema,
  categoryIds: z.array(categoryIdSchema).min(1)
});

export const createListingSchema = listingBaseSchema.superRefine((data, ctx) => {
  if (!data.categoryIds.includes(data.primaryCategoryId)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["categoryIds"],
      message: "Primary category must be included in categoryIds"
    });
  }
});

export const updateListingSchema = listingBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided"
  })
  .superRefine((data, ctx) => {
    if (data.categoryIds && data.categoryIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["categoryIds"],
        message: "At least one category must be selected"
      });
    }

    if (data.primaryCategoryId && data.categoryIds && !data.categoryIds.includes(data.primaryCategoryId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["categoryIds"],
        message: "Primary category must be included in categoryIds"
      });
    }
  });

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
