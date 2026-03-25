"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import AdminFormActions, { ADMIN_ACTION_BUTTON_CLASS } from "@/app/(admin)/components/AdminFormActions";
import { Button } from "@/components/base/buttons/button";
import {
  ADMIN_FIELD_ERROR_CLASS,
  ADMIN_FIELD_REGISTRY_CONTROLS_CLASS,
  ADMIN_FIELD_REGISTRY_ITEM_CLASS,
  ADMIN_FIELD_REGISTRY_LIST_CLASS,
  ADMIN_FIELD_REGISTRY_LIST_INVALID_CLASS,
  ADMIN_FIELD_REGISTRY_META_CLASS,
  ADMIN_FORM_CLASS,
  ADMIN_FORM_SECTION_SPACED_CLASS,
  ADMIN_FORM_SECTION_TIGHT_CLASS,
  ADMIN_HEADER_ACTIONS_CLASS,
  ADMIN_HEADER_ROW_CLASS,
  ADMIN_HERO_CLASS,
  ADMIN_PAGE_CLASS,
  ADMIN_REQUIRED_LEGEND_CLASS,
  ADMIN_STATUS_MESSAGE_CLASS,
  ADMIN_STATUS_MESSAGE_ERROR_CLASS,
  ADMIN_TITLE_CLASS,
  joinAdminClassNames
} from "@/app/(admin)/components/admin-tailwind";
import DeleteConfirmModal from "@/app/(admin)/components/DeleteConfirmModal";
import { Card, CheckboxField, Field, FormSection, TextArea, TextInput } from "@/components/ui";
import type { AdminSchemaFieldRecord, AdminSchemaRecord } from "../lib/admin-schemas";
import { LISTING_FIELDS, type ListingFieldDefinition } from "@/lib/listing-fields";

type ApiIssue = {
  path?: Array<string | number>;
  message?: string;
};

type ApiError = {
  error?: string;
  issues?: ApiIssue[];
};

type SchemaFieldState = {
  fieldKey: string;
  sortOrder: string;
  isRequired: boolean;
  isFrontendFilterEnabled: boolean;
};

type SchemaFormState = {
  slug: string;
  label: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
  fields: SchemaFieldState[];
};

type SchemaEditorClientProps = {
  mode: "create" | "edit";
  initialSchema?: AdminSchemaRecord;
};

type SchemaValidationErrors = {
  slug?: string;
  label?: string;
  fields?: string;
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

function toFieldState(fields: AdminSchemaFieldRecord[]): SchemaFieldState[] {
  return fields.map((field) => ({
    fieldKey: field.fieldKey,
    sortOrder: String(field.sortOrder),
    isRequired: field.isRequired,
    isFrontendFilterEnabled: field.isFrontendFilterEnabled
  }));
}

function toFormState(schema?: AdminSchemaRecord): SchemaFormState {
  return {
    slug: schema?.slug ?? "",
    label: schema?.label ?? "",
    description: schema?.description ?? "",
    sortOrder: String(schema?.sortOrder ?? 0),
    isActive: schema?.isActive ?? true,
    fields: toFieldState(schema?.fields ?? [])
  };
}

function normalizeFields(fields: SchemaFieldState[]) {
  return fields
    .map((field, index) => ({
      fieldKey: field.fieldKey,
      sortOrder: Number(field.sortOrder || index),
      isRequired: field.isRequired,
      isFrontendFilterEnabled: field.isFrontendFilterEnabled
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

function getValidationErrors(form: SchemaFormState): SchemaValidationErrors {
  const errors: SchemaValidationErrors = {};

  if (form.slug.trim().length === 0) {
    errors.slug = "Slug is required.";
  }

  if (form.label.trim().length === 0) {
    errors.label = "Label is required.";
  }

  if (form.fields.length === 0) {
    errors.fields = "Enable at least one schema field.";
  }

  return errors;
}

function SchemaFieldPicker({
  allFields,
  value,
  onChange,
  errorMessage
}: {
  allFields: ListingFieldDefinition[];
  value: SchemaFieldState[];
  onChange: (next: SchemaFieldState[]) => void;
  errorMessage?: string;
}) {
  return (
    <>
      {errorMessage ? <p className={ADMIN_FIELD_ERROR_CLASS}>{errorMessage}</p> : null}
      <div className={joinAdminClassNames(ADMIN_FIELD_REGISTRY_LIST_CLASS, errorMessage && ADMIN_FIELD_REGISTRY_LIST_INVALID_CLASS)}>
        {allFields.map((field, index) => {
          const current = value.find((item) => item.fieldKey === field.key);
          const enabled = Boolean(current);

        return (
          <article key={field.key} className={ADMIN_FIELD_REGISTRY_ITEM_CLASS}>
            <div className={ADMIN_FIELD_REGISTRY_META_CLASS}>
              <strong>{field.label}</strong>
              <p className="muted">{field.description}</p>
              <p className="muted">Key: {field.key} · Type: {field.component}</p>
            </div>
            <div className={ADMIN_FIELD_REGISTRY_CONTROLS_CLASS}>
              <CheckboxField
                label="Enabled"
                checked={enabled}
                onChange={(checked) => {
                  if (checked) {
                    onChange([
                      ...value,
                      {
                        fieldKey: field.key,
                        sortOrder: String(value.length > 0 ? value.length : index),
                        isRequired: false,
                        isFrontendFilterEnabled: false
                      }
                    ]);
                    return;
                  }

                  onChange(value.filter((item) => item.fieldKey !== field.key));
                }}
              />
              <CheckboxField
                label="Required"
                checked={current?.isRequired ?? false}
                disabled={!enabled}
                onChange={(checked) =>
                  onChange(
                    value.map((item) =>
                      item.fieldKey === field.key ? { ...item, isRequired: checked } : item
                    )
                  )
                }
              />
              {field.supportsFrontendFilter ? (
                <CheckboxField
                  label="Enable filter on frontend"
                  checked={current?.isFrontendFilterEnabled ?? false}
                  disabled={!enabled}
                  onChange={(checked) =>
                    onChange(
                      value.map((item) =>
                        item.fieldKey === field.key ? { ...item, isFrontendFilterEnabled: checked } : item
                      )
                    )
                  }
                />
              ) : null}
              <Field label="Order">
                <TextInput
                  type="number"
                  min="0"
                  disabled={!enabled}
                  value={current?.sortOrder ?? ""}
                  onChange={(nextValue) =>
                    onChange(
                      value.map((item) =>
                        item.fieldKey === field.key ? { ...item, sortOrder: nextValue } : item
                      )
                    )
                  }
                />
              </Field>
            </div>
          </article>
        );
        })}
      </div>
    </>
  );
}

export default function SchemaEditorClient({ mode, initialSchema }: SchemaEditorClientProps) {
  const router = useRouter();
  const isCreate = mode === "create";
  const [form, setForm] = useState<SchemaFormState>(() => toFormState(initialSchema));
  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<"save" | "delete" | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState<"error" | "success" | null>(null);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const fieldDefinitions = useMemo(() => LISTING_FIELDS, []);
  const validationErrors = getValidationErrors(form);
  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActiveAction("save");
    setHasTriedSubmit(true);

    if (hasValidationErrors) {
      setStatusMessage("Please complete the required fields.");
      setStatusTone("error");
      setActiveAction(null);
      return;
    }

    setIsLoading(true);
    setStatusMessage("");
    setStatusTone(null);

    const response = await fetch(isCreate ? "/api/admin/schemas" : `/api/admin/schemas/${initialSchema?.id ?? ""}`,
      {
        method: isCreate ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: form.slug,
          label: form.label,
          description: form.description,
          sortOrder: Number(form.sortOrder),
          isActive: form.isActive,
          fields: normalizeFields(form.fields)
        })
      });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as ApiError;
      setStatusMessage(
        isCreate
          ? `Could not create schema. ${getIssueMessage(payload, "Unknown error")}`
          : `Could not update schema. ${getIssueMessage(payload, "Unknown error")}`
      );
      setStatusTone("error");
      setIsLoading(false);
      setActiveAction(null);
      return;
    }

    const payload = (await response.json()) as { data: AdminSchemaRecord };

    if (isCreate) {
      setActiveAction(null);
      router.push(`/admin/schemas/${payload.data.id}/edit`);
      return;
    }

    setForm(toFormState(payload.data));
    setStatusMessage("Schema updated.");
    setStatusTone("success");
    setIsLoading(false);
    setActiveAction(null);
    router.refresh();
  }

  async function onDeleteConfirmed() {
    if (!initialSchema) {
      return;
    }

    setActiveAction("delete");
    setIsLoading(true);
    setStatusMessage("");
    setStatusTone(null);

    const response = await fetch(`/api/admin/schemas/${initialSchema.id}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as ApiError;
      setStatusMessage(`Could not delete schema. ${getIssueMessage(payload, "Unknown error")}`);
      setStatusTone("error");
      setIsDeleteDialogOpen(false);
      setIsLoading(false);
      setActiveAction(null);
      return;
    }

    setActiveAction(null);
    router.push("/admin/schemas");
    router.refresh();
  }

  return (
    <main className={ADMIN_PAGE_CLASS}>
      <section className={ADMIN_HERO_CLASS}>
        <div className={ADMIN_HEADER_ROW_CLASS}>
          <h1 className={ADMIN_TITLE_CLASS}>{isCreate ? "New Schema" : "Edit Schema"}</h1>
          <div className={ADMIN_HEADER_ACTIONS_CLASS}>
            <Button color="secondary" size="md" href="/admin/schemas">
              Back to Schemas
            </Button>
          </div>
        </div>
        <p>
          {isCreate
            ? "Compose a new schema from the available code-defined fields."
            : "Update the schema assigned to categories and listing forms."}
        </p>
        <p className={ADMIN_REQUIRED_LEGEND_CLASS}>Fields marked with * are required.</p>
      </section>

      <Card as="section">
        <FormSection title={isCreate ? "Schema details" : initialSchema?.label ?? "Schema details"}>
          <form className={ADMIN_FORM_CLASS} onSubmit={onSubmit} noValidate>
            <Field label="Slug">
              <TextInput
                value={form.slug}
                onChange={(value) => setForm((previous) => ({ ...previous, slug: value }))}
                isInvalid={hasTriedSubmit && Boolean(validationErrors.slug)}
                errorMessage={hasTriedSubmit ? validationErrors.slug : undefined}
                required
              />
            </Field>
            <Field label="Label">
              <TextInput
                value={form.label}
                onChange={(value) => setForm((previous) => ({ ...previous, label: value }))}
                isInvalid={hasTriedSubmit && Boolean(validationErrors.label)}
                errorMessage={hasTriedSubmit ? validationErrors.label : undefined}
                required
              />
            </Field>
            <Field label="Description">
              <TextArea
                value={form.description}
                onChange={(value) => setForm((previous) => ({ ...previous, description: value }))}
                rows={3}
              />
            </Field>
            <Field label="Sort order">
              <TextInput
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(value) => setForm((previous) => ({ ...previous, sortOrder: value }))}
              />
            </Field>
            <CheckboxField
              label="Active schema"
              checked={form.isActive}
              onChange={(checked) => setForm((previous) => ({ ...previous, isActive: checked }))}
            />
            <FormSection
              title="Schema fields"
              className={joinAdminClassNames(ADMIN_FORM_SECTION_SPACED_CLASS, ADMIN_FORM_SECTION_TIGHT_CLASS)}
            >
              <SchemaFieldPicker
                allFields={fieldDefinitions}
                value={form.fields}
                onChange={(fields) => setForm((previous) => ({ ...previous, fields }))}
                errorMessage={hasTriedSubmit ? validationErrors.fields : undefined}
              />
            </FormSection>
            <AdminFormActions
              primaryActions={
                <Button type="submit" size="md" isDisabled={isLoading} isLoading={isLoading && activeAction === "save"} className={ADMIN_ACTION_BUTTON_CLASS}>
                  {isCreate ? "Create schema" : "Save changes"}
                </Button>
              }
              destructiveAction={
                !isCreate ? (
                  <Button color="primary-destructive" size="md" type="button" onClick={() => setIsDeleteDialogOpen(true)} isDisabled={isLoading} className={ADMIN_ACTION_BUTTON_CLASS}>
                    Delete
                  </Button>
                ) : undefined
              }
            />
          </form>
          {statusMessage ? (
            <p className={joinAdminClassNames(ADMIN_STATUS_MESSAGE_CLASS, statusTone === "error" && ADMIN_STATUS_MESSAGE_ERROR_CLASS)}>{statusMessage}</p>
          ) : null}
        </FormSection>
      </Card>

      <DeleteConfirmModal
        isOpen={isDeleteDialogOpen}
        title="Delete schema?"
        description={`This will permanently delete ${initialSchema?.label ?? "this schema"}. This action cannot be undone. Delete only works when no categories still use this schema.`}
        isLoading={isLoading && activeAction === "delete"}
        onCancel={() => {
          if (isLoading) {
            return;
          }

          setIsDeleteDialogOpen(false);
        }}
        onConfirm={onDeleteConfirmed}
      />
    </main>
  );
}
