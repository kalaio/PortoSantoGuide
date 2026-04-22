import type { ListingStatus } from "@prisma/client";
import type { AdminCategoryOption } from "../../lib/admin-categories";
import type { ListingPhoto, ListingPhotoSectionSummary } from "@/types/listing";

export type ApiIssue = {
  path?: Array<string | number>;
  message?: string;
};

export type ApiErrorResponse = {
  error?: string;
  issues?: ApiIssue[];
};

export type ListingFormState = {
  slug: string;
  title: string;
  status: ListingStatus;
  description: string;
  latitude: string;
  longitude: string;
  primaryCategoryId: string;
  categoryIds: string[];
};

export type ListingPhotoDraft = {
  id: string;
  assetId: string;
  path: string;
  thumbnailPath: string | null;
  alt: string;
  width: number | null;
  height: number | null;
  sortOrder: number;
  isCover: boolean;
  photoSectionId: string | null;
};

export type ListingPhotoSectionOption = ListingPhotoSectionSummary;

export function toListingPhotoDraft(photo: ListingPhoto): ListingPhotoDraft {
  return {
    id: photo.id,
    assetId: photo.assetId,
    path: photo.path,
    thumbnailPath: photo.thumbnailPath,
    alt: photo.alt ?? "",
    width: photo.width,
    height: photo.height,
    sortOrder: photo.sortOrder,
    isCover: photo.isCover,
    photoSectionId: photo.section?.id ?? null
  };
}

export type ListingCategorySectionProps = {
  categories: AdminCategoryOption[];
  form: ListingFormState;
  availableCategoryOptions: AdminCategoryOption[];
  onPrimaryCategoryChange: (nextPrimaryCategoryId: string) => void;
  onToggleCategory: (categoryId: string, checked: boolean) => void;
  validationErrors?: {
    primaryCategoryId?: string;
    categoryIds?: string;
  };
};
