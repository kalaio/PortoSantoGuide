"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import AdminFormActions, { ADMIN_ACTION_BUTTON_CLASS } from "@/app/(admin)/components/AdminFormActions";
import { Button } from "@/components/base/buttons/button";
import {
  ADMIN_FORM_CLASS,
  ADMIN_HEADER_ACTIONS_CLASS,
  ADMIN_HEADER_ROW_CLASS,
  ADMIN_HERO_CLASS,
  ADMIN_PAGE_CLASS,
  ADMIN_PANEL_CLASS,
  ADMIN_REQUIRED_LEGEND_CLASS,
  ADMIN_STATUS_MESSAGE_CLASS,
  ADMIN_STATUS_MESSAGE_ERROR_CLASS,
  ADMIN_TITLE_CLASS,
  joinAdminClassNames
} from "@/app/(admin)/components/admin-tailwind";
import ListingCategorySection from "@/app/(admin)/components/listing-editor/ListingCategorySection";
import ListingCoreFields from "@/app/(admin)/components/listing-editor/ListingCoreFields";
import ListingDetailsFields from "@/app/(admin)/components/listing-editor/ListingDetailsFields";
import {
  buildInitialForm,
  getListingBaseValidationErrors,
  getListingValidationDisplayIssues
} from "@/app/(admin)/components/listing-editor/helpers";
import type { ApiErrorResponse, ListingFormState } from "@/app/(admin)/components/listing-editor/types";
import { useListingMap } from "@/app/(admin)/components/listing-editor/useListingMap";
import type { AdminCategoryOption } from "@/lib/admin-categories";
import { hasListingSchemaField } from "@/lib/listing-fields";
import { validateListingPayloadAgainstSchemaFields } from "@/lib/listing-schema-validation";
import { getCategorySchemaFields } from "@/lib/listing-schema-helpers";
import {
  INITIAL_DETAILS_DRAFT,
  type ListingDetailsDraft,
  toListingDetailsPayload
} from "@/lib/listing-details-form";

export default function NewListingClient({ initialCategories }: { initialCategories: AdminCategoryOption[] }) {
  const router = useRouter();
  const [form, setForm] = useState<ListingFormState>(() => buildInitialForm(initialCategories));
  const [detailsDraft, setDetailsDraft] = useState<ListingDetailsDraft>(INITIAL_DETAILS_DRAFT);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [statusTone, setStatusTone] = useState<"error" | "success" | null>(null);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<"create" | null>(null);
  const categories = initialCategories;

  const primaryCategory = useMemo(
    () => categories.find((category) => category.id === form.primaryCategoryId) ?? null,
    [categories, form.primaryCategoryId]
  );

  const activeSchemaFields = useMemo(() => getCategorySchemaFields(primaryCategory), [primaryCategory]);
  const isMapEnabled = useMemo(() => hasListingSchemaField(activeSchemaFields, "location"), [activeSchemaFields]);
  const { mapNodeRef } = useListingMap({
    form,
    setForm,
    initializeDefaultCoordinates: true,
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

    return categories.filter((category) => category.sectionId === primaryCategory.sectionId);
  }, [categories, primaryCategory]);

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

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActiveAction("create");
    setHasTriedSubmit(true);
    setStatusTone(null);

    if (hasValidationErrors) {
      setStatusMessage("Please complete the required fields.");
      setStatusTone("error");
      setActiveAction(null);
      return;
    }

    setIsLoading(true);
    setStatusMessage("");
    setStatusTone(null);

    const response = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(form))
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as ApiErrorResponse;
      const firstIssue = payload.issues?.[0];

      if (firstIssue?.message) {
        const field = firstIssue.path?.join(".") ?? "";
        const label = field ? `${field}: ` : "";
        setStatusMessage(`Could not create listing. ${label}${firstIssue.message}`);
        setStatusTone("error");
        setIsLoading(false);
        setActiveAction(null);
        return;
      }

      setStatusMessage(payload.error ?? "Could not create listing. Check required fields.");
      setStatusTone("error");
      setIsLoading(false);
      setActiveAction(null);
      return;
    }

    setActiveAction(null);
    router.push("/admin/listings");
  }

  return (
    <main className={ADMIN_PAGE_CLASS}>
      <section className={ADMIN_HERO_CLASS}>
        <div className={ADMIN_HEADER_ROW_CLASS}>
          <h1 className={ADMIN_TITLE_CLASS}>Create Listing</h1>
          <div className={ADMIN_HEADER_ACTIONS_CLASS}>
            <Button color="secondary" size="md" href="/admin/listings">
              Back to Listings
            </Button>
          </div>
        </div>
        <p>Create a listing, define the canonical category, and fill only relevant details.</p>
        <p className={ADMIN_REQUIRED_LEGEND_CLASS}>Fields marked with * are required.</p>
      </section>

      <section className={ADMIN_PANEL_CLASS}>
        <form className={ADMIN_FORM_CLASS} onSubmit={onCreate} noValidate>
          <ListingCoreFields
            form={form}
            onChange={(updater) => setForm((previous) => updater(previous))}
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
          <AdminFormActions
            primaryActions={
              <Button type="submit" size="md" isDisabled={isLoading} isLoading={isLoading && activeAction === "create"} className={ADMIN_ACTION_BUTTON_CLASS}>
                Create listing
              </Button>
            }
          />
        </form>

        {statusMessage ? (
          <p className={joinAdminClassNames(ADMIN_STATUS_MESSAGE_CLASS, statusTone === "error" && ADMIN_STATUS_MESSAGE_ERROR_CLASS)}>{statusMessage}</p>
        ) : null}
      </section>
    </main>
  );
}
