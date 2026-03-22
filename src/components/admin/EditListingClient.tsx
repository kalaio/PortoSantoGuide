"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Chip } from "@heroui/react";
import {
  ADMIN_ACTIONS_CLASS,
  ADMIN_FORM_CLASS,
  ADMIN_HEADER_ACTIONS_CLASS,
  ADMIN_HEADER_ROW_CLASS,
  ADMIN_HERO_CLASS,
  ADMIN_DRAFT_CHIP_CLASS,
  ADMIN_LISTING_STATE_BAR_CLASS,
  ADMIN_PAGE_CLASS,
  ADMIN_PANEL_CLASS,
  ADMIN_REQUIRED_LEGEND_CLASS,
  ADMIN_STATUS_MESSAGE_CLASS,
  ADMIN_STATUS_MESSAGE_ERROR_CLASS,
  ADMIN_TITLE_CLASS,
  joinAdminClassNames
} from "@/components/admin/admin-tailwind";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import ListingCategorySection from "@/components/admin/listing-editor/ListingCategorySection";
import ListingCoreFields from "@/components/admin/listing-editor/ListingCoreFields";
import ListingDetailsFields from "@/components/admin/listing-editor/ListingDetailsFields";
import {
  getListingBaseValidationErrors,
  getListingValidationDisplayIssues
} from "@/components/admin/listing-editor/helpers";
import { useListingMap } from "@/components/admin/listing-editor/useListingMap";
import type { ApiErrorResponse, ListingFormState } from "@/components/admin/listing-editor/types";
import { Button, ButtonLink } from "@/components/ui";
import type { AdminCategoryOption } from "@/lib/admin-categories";
import { hasListingSchemaField } from "@/lib/listing-fields";
import { validateListingPayloadAgainstSchemaFields } from "@/lib/listing-schema-validation";
import type { ListingDetails } from "@/lib/listing-details";
import { getCategorySchemaFields } from "@/lib/listing-schema-helpers";
import type { ListingSchemaFieldSummary } from "@/types/listing";
import {
  INITIAL_DETAILS_DRAFT,
  type ListingDetailsDraft,
  toListingDetailsDraft,
  toListingDetailsPayload
} from "@/lib/listing-details-form";

type ListingDto = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: ListingFormState["status"];
  liveStatus: ListingFormState["status"];
  hasDraftRevision: boolean;
  latitude: number | null;
  longitude: number | null;
  details: ListingDetails;
  primaryCategoryId: string;
  primarySchema: {
    fields: ListingSchemaFieldSummary[];
  } | null;
  categoryIds: string[];
};

function toFormState(listing: ListingDto): ListingFormState {
  return {
    slug: listing.slug,
    title: listing.title,
    status: listing.status,
    description: listing.description ?? "",
    latitude: listing.latitude === null ? "" : listing.latitude.toFixed(6),
    longitude: listing.longitude === null ? "" : listing.longitude.toFixed(6),
    primaryCategoryId: listing.primaryCategoryId,
    categoryIds: [...listing.categoryIds]
  };
}

export default function EditListingClient({
  initialCategories,
  listing
}: {
  initialCategories: AdminCategoryOption[];
  listing: ListingDto;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ListingFormState>(toFormState(listing));
  const [detailsDraft, setDetailsDraft] = useState<ListingDetailsDraft>(() =>
    toListingDetailsDraft(listing.details)
  );
  const [liveStatus, setLiveStatus] = useState<ListingFormState["status"]>(listing.liveStatus);
  const [hasDraftRevision, setHasDraftRevision] = useState(listing.hasDraftRevision);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState<"error" | "success" | null>(null);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const categories = initialCategories;
  const isPublishedListing = liveStatus === "PUBLISHED";
  const isArchivedListing = liveStatus === "ARCHIVED";

  function getLiveStatusChipColor(status: ListingFormState["status"]) {
    switch (status) {
      case "PUBLISHED":
        return "success" as const;
      case "ARCHIVED":
        return "warning" as const;
      default:
        return "default" as const;
    }
  }

  function formatStatus(status: ListingFormState["status"]) {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  const primaryCategory = useMemo(
    () => categories.find((category) => category.id === form.primaryCategoryId) ?? null,
    [categories, form.primaryCategoryId]
  );

  const activeSchemaFields = useMemo(
    () => getCategorySchemaFields(primaryCategory ?? listing.primarySchema),
    [listing.primarySchema, primaryCategory]
  );
  const isMapEnabled = useMemo(() => hasListingSchemaField(activeSchemaFields, "location"), [activeSchemaFields]);
  const { mapNodeRef } = useListingMap({
    form,
    setForm,
    initializeDefaultCoordinates: false,
    isMapEnabled
  });
  const detailsPayload = useMemo(
    () => toListingDetailsPayload(activeSchemaFields, detailsDraft),
    [activeSchemaFields, detailsDraft]
  );
  const schemaValidationIssues = useMemo(
    () =>
      validateListingPayloadAgainstSchemaFields({
        description: form.description,
        latitude: form.latitude.trim().length > 0 ? Number(form.latitude) : null,
        longitude: form.longitude.trim().length > 0 ? Number(form.longitude) : null,
        details: detailsPayload,
        schemaFields: activeSchemaFields
      }),
    [activeSchemaFields, detailsPayload, form.description, form.latitude, form.longitude]
  );
  const validationDisplayIssues = useMemo(
    () => getListingValidationDisplayIssues(schemaValidationIssues),
    [schemaValidationIssues]
  );
  const baseValidationErrors = useMemo(() => getListingBaseValidationErrors(form), [form]);
  const hasBaseValidationErrors = useMemo(
    () => Object.keys(baseValidationErrors).length > 0,
    [baseValidationErrors]
  );
  const hasValidationErrors = hasBaseValidationErrors || validationDisplayIssues.length > 0;
  const validationErrorMap = useMemo(
    () => Object.fromEntries(validationDisplayIssues.map((issue) => [issue.key, issue.message])),
    [validationDisplayIssues]
  );

  const availableCategoryOptions = useMemo(() => {
    if (!primaryCategory) {
      return [];
    }

    return categories.filter((category) => {
      if (category.sectionId !== primaryCategory.sectionId) {
        return false;
      }

      if (category.id === form.primaryCategoryId || form.categoryIds.includes(category.id)) {
        return true;
      }

      return category.isActive && category.section.isActive;
    });
  }, [categories, form.categoryIds, form.primaryCategoryId, primaryCategory]);

  function toggleCategory(categoryId: string, checked: boolean) {
    setForm((previous) => {
      if (categoryId === previous.primaryCategoryId) {
        return previous;
      }

      const next = new Set(previous.categoryIds);

      if (checked) {
        next.add(categoryId);
      } else {
        next.delete(categoryId);
      }

      next.add(previous.primaryCategoryId);

      return {
        ...previous,
        categoryIds: [...next]
      };
    });
  }

  function onPrimaryCategoryChange(nextPrimaryCategoryId: string) {
    const nextPrimary = categories.find((category) => category.id === nextPrimaryCategoryId);
    if (!nextPrimary) {
      return;
    }

    setForm((previous) => {
      const sameSectionCategoryIds = previous.categoryIds.filter((categoryId) => {
        const category = categories.find((item) => item.id === categoryId);
        return category?.sectionId === nextPrimary.sectionId;
      });

      const nextCategoryIds = new Set<string>(sameSectionCategoryIds);
      nextCategoryIds.add(nextPrimary.id);

      return {
        ...previous,
        primaryCategoryId: nextPrimary.id,
        categoryIds: [...nextCategoryIds]
      };
    });

    setDetailsDraft((previous) => ({
      ...INITIAL_DETAILS_DRAFT,
      ...previous,
      cuisines: hasListingSchemaField(getCategorySchemaFields(nextPrimary), "cuisines") ? previous.cuisines : []
    }));
  }

  function toPayload(currentForm: ListingFormState) {
    return {
      slug: currentForm.slug,
      title: currentForm.title,
      status: currentForm.status,
      description: currentForm.description.trim().length > 0 ? currentForm.description : null,
      latitude: currentForm.latitude.trim().length > 0 ? Number(currentForm.latitude) : null,
      longitude: currentForm.longitude.trim().length > 0 ? Number(currentForm.longitude) : null,
      details: detailsPayload,
      primaryCategoryId: currentForm.primaryCategoryId,
      categoryIds: [...new Set(currentForm.categoryIds)]
    };
  }

  async function persistChanges() {
    setHasTriedSubmit(true);
    setStatusTone(null);

    if (hasValidationErrors) {
      setStatusMessage("Please complete the required fields.");
      setStatusTone("error");
      return null;
    }

    setIsLoading(true);
    setStatusMessage("");
    setStatusTone(null);

    const response = await fetch(`/api/listings/${listing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(form))
    });

    setIsLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as ApiErrorResponse;
      const firstIssue = payload.issues?.[0];

      if (firstIssue?.message) {
        const field = firstIssue.path?.join(".") ?? "";
        const label = field ? `${field}: ` : "";
        setStatusMessage(`Could not update listing. ${label}${firstIssue.message}`);
        setStatusTone("error");
        return null;
      }

      setStatusMessage(payload.error ?? "Could not update listing.");
      setStatusTone("error");
      return null;
    }

    return (await response.json()) as {
      data: {
        slug: string;
      };
      mode: "draft" | "live";
      hasDraftRevision?: boolean;
    };
  }

  async function onUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = await persistChanges();

    if (!payload) {
      return;
    }

    if (payload.mode === "draft") {
      setHasDraftRevision(Boolean(payload.hasDraftRevision));
      setStatusMessage("Draft changes saved. Publish to update the live listing.");
      setStatusTone("success");
      return;
    }

    setStatusMessage("Listing updated.");
    setStatusTone("success");
    router.refresh();
  }

  async function onPublish() {
    const saved = await persistChanges();

    if (!saved) {
      return;
    }

    if (saved.mode === "draft") {
      setHasDraftRevision(Boolean(saved.hasDraftRevision));
    }

    setIsLoading(true);
    setStatusMessage("");
    setStatusTone(null);

    const response = await fetch(`/api/listings/${listing.id}/publish`, {
      method: "POST"
    });

    setIsLoading(false);

    const payload = (await response.json().catch(() => ({}))) as ApiErrorResponse & {
      data?: { slug?: string; status?: ListingFormState["status"] };
    };

    if (!response.ok) {
      setStatusMessage(payload.error ?? "Could not publish listing.");
      setStatusTone("error");
      return;
    }

    setHasDraftRevision(false);
    setLiveStatus("PUBLISHED");
    setStatusMessage("Listing published.");
    setStatusTone("success");

    router.push(`/admin/listings/${listing.id}/edit`);
  }

  async function onDiscardDraft() {
    setIsLoading(true);
    setStatusMessage("");
    setStatusTone(null);

    const response = await fetch(`/api/listings/${listing.id}/discard-draft`, {
      method: "POST"
    });

    setIsLoading(false);

    const payload = (await response.json().catch(() => ({}))) as ApiErrorResponse;

    if (!response.ok) {
      setStatusMessage(payload.error ?? "Could not discard draft.");
      setStatusTone("error");
      return;
    }

    setHasDraftRevision(false);
    setStatusMessage("Draft discarded.");
    setStatusTone("success");
    router.refresh();
  }

  async function onArchive() {
    setIsLoading(true);
    setStatusMessage("");
    setStatusTone(null);

    const response = await fetch(`/api/listings/${listing.id}/archive`, {
      method: "POST"
    });

    setIsLoading(false);

    const payload = (await response.json().catch(() => ({}))) as ApiErrorResponse;

    if (!response.ok) {
      setStatusMessage(payload.error ?? "Could not archive listing.");
      setStatusTone("error");
      return;
    }

    setLiveStatus("ARCHIVED");
    setHasDraftRevision(false);
    setStatusMessage("Listing archived.");
    setStatusTone("success");
    router.refresh();
  }

  async function onUnarchive() {
    const saved = await persistChanges();

    if (!saved) {
      return;
    }

    setIsLoading(true);
    setStatusMessage("");
    setStatusTone(null);

    const endpoint = saved.mode === "draft" || hasDraftRevision ? "publish" : "unarchive";
    const response = await fetch(`/api/listings/${listing.id}/${endpoint}`, {
      method: "POST"
    });

    setIsLoading(false);

    const payload = (await response.json().catch(() => ({}))) as ApiErrorResponse;

    if (!response.ok) {
      setStatusMessage(payload.error ?? "Could not unarchive listing.");
      setStatusTone("error");
      return;
    }

    setHasDraftRevision(false);
    setLiveStatus("PUBLISHED");
    setStatusMessage("Listing unarchived.");
    setStatusTone("success");
    router.refresh();
  }

  async function onDelete() {
    setIsLoading(true);
    setStatusMessage("");
    setStatusTone(null);

    const response = await fetch(`/api/listings/${listing.id}`, {
      method: "DELETE"
    });

    setIsLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as ApiErrorResponse;
      setStatusMessage(payload.error ?? "Could not delete listing.");
      setStatusTone("error");
      setIsDeleteDialogOpen(false);
      return;
    }

    setIsDeleteDialogOpen(false);
    router.push("/admin/listings");
  }

  return (
    <main className={ADMIN_PAGE_CLASS}>
      <section className={ADMIN_HERO_CLASS}>
        <div className={ADMIN_HEADER_ROW_CLASS}>
          <h1 className={ADMIN_TITLE_CLASS}>Edit Listing</h1>
          <div className={ADMIN_HEADER_ACTIONS_CLASS}>
            <ButtonLink variant="secondary" href="/admin/listings">
              Back to Listings
            </ButtonLink>
          </div>
        </div>
        <div className={ADMIN_LISTING_STATE_BAR_CLASS}>
          <Chip color={getLiveStatusChipColor(liveStatus)} radius="sm" size="sm" variant="flat">
            Status: {formatStatus(liveStatus)}
          </Chip>
          {hasDraftRevision ? (
            <Chip className={ADMIN_DRAFT_CHIP_CLASS} radius="sm" size="sm" variant="flat">
              Draft changes pending
            </Chip>
          ) : null}
        </div>
        <p>Update listing details, categories, and coordinates.</p>
        {isPublishedListing ? (
          <p className="muted">
            Published listings remain published on the public site while you edit. Save changes as a draft, then publish when ready.
          </p>
        ) : null}
        {isArchivedListing ? (
          <p className="muted">
            Archived listings stay hidden from the public site until you unarchive them again.
          </p>
        ) : null}
        {hasDraftRevision ? <p className="muted">You are editing draft changes for this listing.</p> : null}
        <p className={ADMIN_REQUIRED_LEGEND_CLASS}>Fields marked with * are required.</p>
      </section>

      <section className={ADMIN_PANEL_CLASS}>
        <form className={ADMIN_FORM_CLASS} onSubmit={onUpdate} noValidate>
            <ListingCoreFields
              form={form}
              onChange={(updater) => setForm((previous) => updater(previous))}
              disableStatus={liveStatus !== "DRAFT"}
              validationErrors={hasTriedSubmit ? baseValidationErrors : {}}
            />
          <ListingCategorySection
            categories={categories}
            form={form}
            availableCategoryOptions={availableCategoryOptions}
            onPrimaryCategoryChange={onPrimaryCategoryChange}
            onToggleCategory={toggleCategory}
            validationErrors={hasTriedSubmit ? baseValidationErrors : undefined}
          />
          <ListingDetailsFields
            schemaFields={activeSchemaFields}
            form={form}
            onFormChange={(updater: (previous: ListingFormState) => ListingFormState) =>
              setForm((previous) => updater(previous))
            }
            mapNodeRef={mapNodeRef}
            draft={detailsDraft}
            onChange={setDetailsDraft}
            validationErrors={hasTriedSubmit ? validationErrorMap : {}}
          />
          <div className={ADMIN_ACTIONS_CLASS}>
            <Button type="submit" disabled={isLoading}>
              {isPublishedListing ? "Save draft" : "Save changes"}
            </Button>
            {isArchivedListing ? (
              <Button variant="secondary" type="button" onClick={onUnarchive} disabled={isLoading}>
                Unarchive
              </Button>
            ) : null}
            {hasDraftRevision || (!isPublishedListing && !isArchivedListing) ? (
              <Button variant="secondary" type="button" onClick={onPublish} disabled={isLoading}>
                {isPublishedListing ? "Publish changes" : "Publish listing"}
              </Button>
            ) : null}
            {hasDraftRevision ? (
              <Button variant="secondary" type="button" onClick={onDiscardDraft} disabled={isLoading}>
                Discard draft
              </Button>
            ) : null}
            {isPublishedListing ? (
              <Button variant="secondary" type="button" onClick={onArchive} disabled={isLoading}>
                Archive
              </Button>
            ) : null}
            <Button
              variant="danger"
              type="button"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isLoading}
            >
              Delete
            </Button>
          </div>
        </form>

        {statusMessage ? (
          <p className={joinAdminClassNames(ADMIN_STATUS_MESSAGE_CLASS, statusTone === "error" && ADMIN_STATUS_MESSAGE_ERROR_CLASS)}>{statusMessage}</p>
        ) : null}
      </section>

      <DeleteConfirmModal
        isOpen={isDeleteDialogOpen}
        title="Delete listing?"
        description="This action cannot be undone."
        isLoading={isLoading}
        onCancel={() => {
          if (isLoading) {
            return;
          }

          setIsDeleteDialogOpen(false);
        }}
        onConfirm={onDelete}
      />
    </main>
  );
}
