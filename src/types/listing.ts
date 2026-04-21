import type { ListingStatus } from "@prisma/client";
import type { ListingDetails } from "@/lib/listing-details";
import type { UiIconId } from "@/lib/ui-icons";

export type ListingSchemaFieldSummary = {
  fieldKey: string;
  sortOrder: number;
  isRequired: boolean;
  isFrontendFilterEnabled: boolean;
};

export type ListingPhotoSectionSummary = {
  id: string;
  slug: string;
  label: string;
  sortOrder: number;
};

export type ListingPhoto = {
  id: string;
  assetId: string;
  path: string;
  thumbnailPath: string | null;
  alt: string | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
  isCover: boolean;
  section: ListingPhotoSectionSummary | null;
};

export type ListingCategorySummary = {
  slug: string;
  label: string;
  iconName: UiIconId | null;
  sectionSlug: string;
  sectionLabel: string;
  schema: {
    slug: string;
    label: string;
    fields: ListingSchemaFieldSummary[];
    photoSections: ListingPhotoSectionSummary[];
  } | null;
};

export type ListingCategoryTag = {
  slug: string;
  label: string;
};

export type Listing = {
  id: string;
  slug: string;
  title: string;
  status: ListingStatus;
  latitude: number | null;
  longitude: number | null;
  rating: number;
  details: ListingDetails;
  primaryCategory: ListingCategorySummary;
  categories: ListingCategoryTag[];
  coverPhoto: ListingPhoto | null;
};

export type ListingDetail = Listing & {
  description: string | null;
  photos: ListingPhoto[];
  photoSections: ListingPhotoSectionSummary[];
};
