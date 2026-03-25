import type { AdminCategoryOption } from "@/lib/admin-categories";
import type { ListingFormState } from "@/app/(admin)/components/listing-editor/types";

export const DEFAULT_LATITUDE = 33.072;
export const DEFAULT_LONGITUDE = -16.3415;

type ValidationIssue = {
  path: Array<string | number>;
  message: string;
};

export type ListingValidationDisplayIssue = {
  key: string;
  label: string;
  message: string;
};

export type ListingBaseValidationErrors = {
  slug?: string;
  title?: string;
  primaryCategoryId?: string;
  categoryIds?: string;
};

function getIssueDisplayMeta(path: Array<string | number>): Pick<ListingValidationDisplayIssue, "key" | "label"> {
  const joinedPath = path.join(".");

  switch (joinedPath) {
    case "description":
      return { key: "description", label: "Description" };
    case "latitude":
    case "longitude":
      return { key: "location", label: "Location" };
    case "details.notes":
      return { key: "notes", label: "Notes" };
    case "details.openingHoursWeek":
      return { key: "openingHours", label: "Weekly schedule" };
    case "details.cuisines":
      return { key: "cuisines", label: "Cuisines" };
    case "details.priceLevel":
      return { key: "priceLevel", label: "Price level" };
    case "details.priceFrom":
      return { key: "priceFrom", label: "Price from" };
    case "details.durationMinutes":
      return { key: "durationMinutes", label: "Duration" };
    case "details.difficulty":
      return { key: "difficulty", label: "Difficulty" };
    case "details.bookingRequired":
      return { key: "bookingRequired", label: "Booking required" };
    case "details.takeaway":
      return { key: "takeaway", label: "Takeaway" };
    case "details.accessType":
      return { key: "accessType", label: "Access type" };
    case "details.bestTime":
      return { key: "bestTime", label: "Best time" };
    case "details.hikeMinutes":
      return { key: "hikeMinutes", label: "Walking time" };
    case "details.entryFee":
      return { key: "entryFee", label: "Entry fee" };
    default:
      return {
        key: joinedPath || "unknown",
        label: String(path[path.length - 1] ?? "Field")
      };
  }
}

export function getListingValidationDisplayIssues(
  issues: ValidationIssue[]
): ListingValidationDisplayIssue[] {
  const uniqueIssues = new Map<string, ListingValidationDisplayIssue>();

  issues.forEach((issue) => {
    const displayMeta = getIssueDisplayMeta(issue.path);

    if (!uniqueIssues.has(displayMeta.key)) {
      uniqueIssues.set(displayMeta.key, {
        ...displayMeta,
        message: issue.message
      });
    }
  });

  return [...uniqueIssues.values()];
}

export function getListingBaseValidationErrors(form: ListingFormState): ListingBaseValidationErrors {
  const errors: ListingBaseValidationErrors = {};

  if (form.slug.trim().length === 0) {
    errors.slug = "Slug is required.";
  }

  if (form.title.trim().length === 0) {
    errors.title = "Title is required.";
  }

  if (form.primaryCategoryId.trim().length === 0) {
    errors.primaryCategoryId = "Primary category is required.";
  }

  if (form.categoryIds.length === 0) {
    errors.categoryIds = "Select at least one category.";
  }

  return errors;
}

export function getCoordinatesFromForm(
  form: Pick<ListingFormState, "latitude" | "longitude">
): [number, number] | null {
  const latitudeValue = form.latitude.trim();
  const longitudeValue = form.longitude.trim();

  if (latitudeValue.length === 0 || longitudeValue.length === 0) {
    return null;
  }

  const latitude = Number(latitudeValue);
  const longitude = Number(longitudeValue);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return [longitude, latitude];
}

export function buildInitialForm(initialCategories: AdminCategoryOption[]): ListingFormState {
  const defaultPrimaryCategoryId = initialCategories[0]?.id ?? "";

  return {
    slug: "",
    title: "",
    status: "DRAFT",
    description: "",
    latitude: "",
    longitude: "",
    primaryCategoryId: defaultPrimaryCategoryId,
    categoryIds: defaultPrimaryCategoryId ? [defaultPrimaryCategoryId] : []
  };
}
