import type { ListingStatus } from "@prisma/client";
import type { ListingDetails } from "@/lib/listing-details";
import type { UiIconId } from "@/lib/ui-icons";

export type ListingSchemaFieldSummary = {
  fieldKey: string;
  sortOrder: number;
  isRequired: boolean;
  isFrontendFilterEnabled: boolean;
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
};

export type ListingDetail = Listing & {
  description: string | null;
};
