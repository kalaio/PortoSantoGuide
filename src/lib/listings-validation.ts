import { ListingStatus } from "@prisma/client";
import { z } from "zod";

const latitudeSchema = z.number().min(-90).max(90);
const longitudeSchema = z.number().min(-180).max(180);

export const listQuerySchema = z.object({
  category: z.string().trim().min(2).max(80).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

const categoryIdSchema = z.string().trim().min(1).max(64);
const photoAssetIdSchema = z.string().trim().min(1).max(64);
const photoSectionIdSchema = z.string().trim().min(1).max(64);

export const listingPhotoPayloadSchema = z.object({
  assetId: photoAssetIdSchema,
  photoSectionId: photoSectionIdSchema.nullable().optional(),
  alt: z.string().trim().max(240).nullable().optional(),
  sortOrder: z.number().int().min(0),
  isCover: z.boolean().optional()
});

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
  categoryIds: z.array(categoryIdSchema).min(1),
  photos: z.array(listingPhotoPayloadSchema).max(100).optional()
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

    if (data.photos) {
      const assetIds = new Set<string>();
      let coverCount = 0;

      data.photos.forEach((photo, index) => {
        if (assetIds.has(photo.assetId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["photos", index, "assetId"],
            message: "Duplicate photo asset"
          });
        }

        assetIds.add(photo.assetId);

        if (photo.isCover) {
          coverCount += 1;
        }
      });

      if (coverCount > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["photos"],
          message: "Only one photo can be marked as cover"
        });
      }
    }
  });

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type ListingPhotoPayloadInput = z.infer<typeof listingPhotoPayloadSchema>;
