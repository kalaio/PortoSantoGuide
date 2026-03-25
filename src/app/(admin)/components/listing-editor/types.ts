import type { ListingStatus } from "@prisma/client";
import type { AdminCategoryOption } from "../../lib/admin-categories";

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
