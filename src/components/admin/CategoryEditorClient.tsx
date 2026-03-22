"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import {
  ADMIN_ACTIONS_CLASS,
  ADMIN_CATEGORY_ICON_INPUT_ROW_CLASS,
  ADMIN_CATEGORY_ICON_PREVIEW_CLASS,
  ADMIN_FORM_CLASS,
  ADMIN_HEADER_ACTIONS_CLASS,
  ADMIN_HEADER_ROW_CLASS,
  ADMIN_HERO_CLASS,
  ADMIN_PAGE_CLASS,
  ADMIN_REQUIRED_LEGEND_CLASS,
  ADMIN_STATUS_MESSAGE_CLASS,
  ADMIN_STATUS_MESSAGE_ERROR_CLASS,
  ADMIN_TITLE_CLASS,
  joinAdminClassNames
} from "@/components/admin/admin-tailwind";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import MaterialSymbolsStylesheetClient from "@/components/icons/material/MaterialSymbolsStylesheetClient";
import CategoryIcon from "@/components/icons/material/CategoryIcon";
import { Button, ButtonLink, Card, CheckboxField, Field, FormSection, SelectInput, TextInput } from "@/components/ui";
import type { AdminCategoryOption } from "@/lib/admin-categories";
import type { AdminSchemaRecord } from "@/lib/admin-schemas";
import type { AdminSectionRecord } from "@/lib/admin-sections";
import { normalizeMaterialSymbolIconName } from "@/lib/material-symbols";

type SchemaOption = Pick<AdminSchemaRecord, "id" | "slug" | "label" | "isActive">;

type ApiIssue = {
  path?: Array<string | number>;
  message?: string;
};

type ApiError = {
  error?: string;
  issues?: ApiIssue[];
};

type CategoryFormState = {
  slug: string;
  label: string;
  iconName: string;
  sectionId: string;
  schemaId: string;
  sortOrder: string;
  isActive: boolean;
};

type CategoryEditorClientProps = {
  mode: "create" | "edit";
  initialCategory?: AdminCategoryOption;
  initialSections: AdminSectionRecord[];
  initialSchemas: SchemaOption[];
};

function getIssueMessage(payload: ApiError, fallback: string) {
  const firstIssue = payload.issues?.[0];
  if (firstIssue?.message) {
    const field = firstIssue.path?.[0];
    const prefix = typeof field === "string" ? `${field}: ` : "";
    return `${prefix}${firstIssue.message}`;
  }

  return payload.error ?? fallback;
}

function toFormState(
  category: AdminCategoryOption | undefined,
  sections: AdminSectionRecord[],
  schemas: SchemaOption[]
): CategoryFormState {
  return {
    slug: category?.slug ?? "",
    label: category?.label ?? "",
    iconName: category?.iconName ?? "",
    sectionId: category?.sectionId ?? sections.find((section) => section.isActive)?.id ?? sections[0]?.id ?? "",
    schemaId: category?.schemaId ?? schemas.find((schema) => schema.isActive)?.id ?? schemas[0]?.id ?? "",
    sortOrder: String(category?.sortOrder ?? 0),
    isActive: category?.isActive ?? true
  };
}

function getValidationErrors(form: CategoryFormState) {
  const errors: Partial<Record<keyof CategoryFormState, string>> = {};

  if (form.slug.trim().length === 0) {
    errors.slug = "Slug is required.";
  }

  if (form.label.trim().length === 0) {
    errors.label = "Label is required.";
  }

  if (form.sectionId.trim().length === 0) {
    errors.sectionId = "Section is required.";
  }

  if (form.schemaId.trim().length === 0) {
    errors.schemaId = "Schema is required.";
  }

  if (form.sortOrder.trim().length === 0) {
    errors.sortOrder = "Sort order is required.";
  }

  return errors;
}

export default function CategoryEditorClient({
  mode,
  initialCategory,
  initialSections,
  initialSchemas
}: CategoryEditorClientProps) {
  const router = useRouter();
  const isCreate = mode === "create";
  const [form, setForm] = useState<CategoryFormState>(() =>
    toFormState(initialCategory, initialSections, initialSchemas)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState<"error" | "success" | null>(null);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const validationErrors = getValidationErrors(form);
  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  const availableSections = useMemo(
    () => initialSections.filter((section) => section.isActive || section.id === form.sectionId),
    [form.sectionId, initialSections]
  );
  const availableSchemas = useMemo(
    () => initialSchemas.filter((schema) => schema.isActive || schema.id === form.schemaId),
    [form.schemaId, initialSchemas]
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasTriedSubmit(true);

    if (hasValidationErrors) {
      setStatusMessage("Please complete the required fields.");
      setStatusTone("error");
      return;
    }

    setIsLoading(true);
    setStatusMessage("");
    setStatusTone(null);

    const response = await fetch(
      isCreate ? "/api/admin/categories" : `/api/admin/categories/${initialCategory?.id ?? ""}`,
      {
        method: isCreate ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: form.slug,
          label: form.label,
          iconName: normalizeMaterialSymbolIconName(form.iconName),
          sectionId: form.sectionId,
          schemaId: form.schemaId,
          sortOrder: Number(form.sortOrder),
          isActive: form.isActive
        })
      }
    );

    setIsLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as ApiError;
      setStatusMessage(
        isCreate
          ? `Could not create category. ${getIssueMessage(payload, "Unknown error")}`
          : `Could not update category. ${getIssueMessage(payload, "Unknown error")}`
      );
      setStatusTone("error");
      return;
    }

    const payload = (await response.json()) as { data: AdminCategoryOption };

    if (isCreate) {
      router.push(`/admin/categories/${payload.data.id}/edit`);
      return;
    }

    setForm((previous) => ({
      ...previous,
      slug: payload.data.slug,
      label: payload.data.label,
      iconName: payload.data.iconName ?? "",
      sectionId: payload.data.sectionId,
      schemaId: payload.data.schemaId ?? "",
      sortOrder: String(payload.data.sortOrder),
      isActive: payload.data.isActive
    }));
    setStatusMessage("Category updated.");
    setStatusTone("success");
    router.refresh();
  }

  async function onDeleteConfirmed() {
    if (!initialCategory) {
      return;
    }

    setIsLoading(true);
    setStatusMessage("");
    setStatusTone(null);

    const response = await fetch(`/api/admin/categories/${initialCategory.id}`, {
      method: "DELETE"
    });

    setIsLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as ApiError;
      setStatusMessage(`Could not delete category. ${getIssueMessage(payload, "Unknown error")}`);
      setStatusTone("error");
      setIsDeleteDialogOpen(false);
      return;
    }

    router.push("/admin/categories");
    router.refresh();
  }

  const currentSection = initialSections.find((section) => section.id === form.sectionId) ?? null;
  const currentSchema = initialSchemas.find((schema) => schema.id === form.schemaId) ?? null;

  return (
    <>
      <MaterialSymbolsStylesheetClient iconNames={[form.iconName]} />

      <main className={ADMIN_PAGE_CLASS}>
        <section className={ADMIN_HERO_CLASS}>
          <div className={ADMIN_HEADER_ROW_CLASS}>
            <h1 className={ADMIN_TITLE_CLASS}>{isCreate ? "New Category" : "Edit Category"}</h1>
            <div className={ADMIN_HEADER_ACTIONS_CLASS}>
              <ButtonLink variant="secondary" href="/admin/categories">
                Back to Categories
              </ButtonLink>
            </div>
          </div>
          <p>
            {isCreate
              ? "Create a new category and attach it to a section and schema."
              : "Update the category used in admin organization and public URLs."}
          </p>
          <p className={ADMIN_REQUIRED_LEGEND_CLASS}>Fields marked with * are required.</p>
        </section>

        <Card as="section">
          <FormSection title={isCreate ? "Category details" : initialCategory?.label ?? "Category details"}>
            <form className={ADMIN_FORM_CLASS} onSubmit={onSubmit} noValidate>
              <Field label="Slug">
                <TextInput
                  value={form.slug}
                  onChange={(event) => setForm((previous) => ({ ...previous, slug: event.target.value }))}
                  isInvalid={hasTriedSubmit && Boolean(validationErrors.slug)}
                  errorMessage={hasTriedSubmit ? validationErrors.slug : undefined}
                  required
                />
              </Field>
              <Field label="Label">
                <TextInput
                  value={form.label}
                  onChange={(event) => setForm((previous) => ({ ...previous, label: event.target.value }))}
                  isInvalid={hasTriedSubmit && Boolean(validationErrors.label)}
                  errorMessage={hasTriedSubmit ? validationErrors.label : undefined}
                  required
                />
              </Field>
              <Field label="Icon name" hint="Material symbol name">
                <div className={ADMIN_CATEGORY_ICON_INPUT_ROW_CLASS}>
                  <TextInput
                    value={form.iconName}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, iconName: event.target.value }))
                    }
                    placeholder="award_meal"
                  />
                  <span className={ADMIN_CATEGORY_ICON_PREVIEW_CLASS} aria-hidden="true">
                    <CategoryIcon iconName={form.iconName} />
                  </span>
                </div>
              </Field>
              <Field label="Section">
                <SelectInput
                  value={form.sectionId}
                  onChange={(event) => setForm((previous) => ({ ...previous, sectionId: event.target.value }))}
                  isInvalid={hasTriedSubmit && Boolean(validationErrors.sectionId)}
                  errorMessage={hasTriedSubmit ? validationErrors.sectionId : undefined}
                  required
                >
                  {availableSections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Schema">
                <SelectInput
                  value={form.schemaId}
                  onChange={(event) => setForm((previous) => ({ ...previous, schemaId: event.target.value }))}
                  isInvalid={hasTriedSubmit && Boolean(validationErrors.schemaId)}
                  errorMessage={hasTriedSubmit ? validationErrors.schemaId : undefined}
                  required
                >
                  {availableSchemas.map((schema) => (
                    <option key={schema.id} value={schema.id}>
                      {schema.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Sort order">
                <TextInput
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, sortOrder: event.target.value }))
                  }
                  isInvalid={hasTriedSubmit && Boolean(validationErrors.sortOrder)}
                  errorMessage={hasTriedSubmit ? validationErrors.sortOrder : undefined}
                  required
                />
              </Field>
              <CheckboxField
                label="Active category"
                checked={form.isActive}
                onChange={(checked) => setForm((previous) => ({ ...previous, isActive: checked }))}
              />
              {currentSection || currentSchema ? (
                <p className="muted">
                  {currentSection ? `Section: ${currentSection.label} (${currentSection.slug})` : ""}
                  {currentSection && currentSchema ? " · " : ""}
                  {currentSchema ? `Schema: ${currentSchema.label} (${currentSchema.slug})` : ""}
                </p>
              ) : null}
              <div className={ADMIN_ACTIONS_CLASS}>
                <Button type="submit" disabled={isLoading}>
                  {isCreate ? "Create category" : "Save changes"}
                </Button>
                {!isCreate ? (
                  <Button
                    variant="danger"
                    type="button"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={isLoading}
                  >
                    Delete
                  </Button>
                ) : null}
              </div>
            </form>
            {availableSections.length === 0 || availableSchemas.length === 0 ? (
              <p className={joinAdminClassNames(ADMIN_STATUS_MESSAGE_CLASS, ADMIN_STATUS_MESSAGE_ERROR_CLASS)}>
                You need at least one active section and one active schema.
              </p>
            ) : null}
            {statusMessage ? (
              <p className={joinAdminClassNames(ADMIN_STATUS_MESSAGE_CLASS, statusTone === "error" && ADMIN_STATUS_MESSAGE_ERROR_CLASS)}>{statusMessage}</p>
            ) : null}
          </FormSection>
        </Card>

        <DeleteConfirmModal
          isOpen={isDeleteDialogOpen}
          title="Delete category?"
          description={`This will remove ${initialCategory?.label ?? "this category"} permanently. Delete only works when the category is no longer attached to any listings.`}
          isLoading={isLoading}
          onCancel={() => {
            if (isLoading) {
              return;
            }

            setIsDeleteDialogOpen(false);
          }}
          onConfirm={onDeleteConfirmed}
        />
      </main>
    </>
  );
}
