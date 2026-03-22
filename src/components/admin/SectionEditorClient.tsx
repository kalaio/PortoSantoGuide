"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  ADMIN_ACTIONS_CLASS,
  ADMIN_HEADER_ACTIONS_CLASS,
  ADMIN_FORM_CLASS,
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
import { Button, ButtonLink, Card, CheckboxField, Field, FormSection, TextInput } from "@/components/ui";
import type { AdminSectionRecord } from "@/lib/admin-sections";

type ApiIssue = {
  path?: Array<string | number>;
  message?: string;
};

type ApiError = {
  error?: string;
  issues?: ApiIssue[];
};

type SectionFormState = {
  slug: string;
  label: string;
  sortOrder: string;
  isActive: boolean;
};

type SectionEditorClientProps = {
  mode: "create" | "edit";
  initialSection?: AdminSectionRecord;
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

function toFormState(section?: AdminSectionRecord): SectionFormState {
  return {
    slug: section?.slug ?? "",
    label: section?.label ?? "",
    sortOrder: String(section?.sortOrder ?? 0),
    isActive: section?.isActive ?? true
  };
}

function getValidationErrors(form: SectionFormState) {
  const errors: Partial<Record<keyof SectionFormState, string>> = {};

  if (form.slug.trim().length === 0) {
    errors.slug = "Slug is required.";
  }

  if (form.label.trim().length === 0) {
    errors.label = "Label is required.";
  }

  if (form.sortOrder.trim().length === 0) {
    errors.sortOrder = "Sort order is required.";
  }

  return errors;
}

export default function SectionEditorClient({ mode, initialSection }: SectionEditorClientProps) {
  const router = useRouter();
  const isCreate = mode === "create";
  const [form, setForm] = useState<SectionFormState>(() => toFormState(initialSection));
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState<"error" | "success" | null>(null);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const validationErrors = getValidationErrors(form);
  const hasValidationErrors = Object.keys(validationErrors).length > 0;

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

    const response = await fetch(isCreate ? "/api/admin/sections" : `/api/admin/sections/${initialSection?.id ?? ""}`,
      {
        method: isCreate ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: form.slug,
          label: form.label,
          sortOrder: Number(form.sortOrder),
          isActive: form.isActive
        })
      });

    setIsLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as ApiError;
      setStatusMessage(
        isCreate
          ? `Could not create section. ${getIssueMessage(payload, "Unknown error")}`
          : `Could not update section. ${getIssueMessage(payload, "Unknown error")}`
      );
      setStatusTone("error");
      return;
    }

    const payload = (await response.json()) as { data: AdminSectionRecord };

    if (isCreate) {
      router.push(`/admin/sections/${payload.data.id}/edit`);
      return;
    }

    setForm(toFormState(payload.data));
    setStatusMessage("Section updated.");
    setStatusTone("success");
    router.refresh();
  }

  async function onDeleteConfirmed() {
    if (!initialSection) {
      return;
    }

    setIsLoading(true);
    setStatusMessage("");
    setStatusTone(null);

    const response = await fetch(`/api/admin/sections/${initialSection.id}`, {
      method: "DELETE"
    });

    setIsLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as ApiError;
      setStatusMessage(`Could not delete section. ${getIssueMessage(payload, "Unknown error")}`);
      setStatusTone("error");
      setIsDeleteDialogOpen(false);
      return;
    }

    router.push("/admin/sections");
    router.refresh();
  }

  return (
    <main className={ADMIN_PAGE_CLASS}>
      <section className={ADMIN_HERO_CLASS}>
        <div className={ADMIN_HEADER_ROW_CLASS}>
          <h1 className={ADMIN_TITLE_CLASS}>{isCreate ? "New Section" : "Edit Section"}</h1>
          <div className={ADMIN_HEADER_ACTIONS_CLASS}>
            <ButtonLink variant="secondary" href="/admin/sections">
              Back to Sections
            </ButtonLink>
          </div>
        </div>
        <p>
          {isCreate
            ? "Create a new top-level directory section."
            : "Update the section metadata used across admin navigation and public grouping."}
        </p>
        <p className={ADMIN_REQUIRED_LEGEND_CLASS}>Fields marked with * are required.</p>
      </section>

      <Card as="section">
        <FormSection title={isCreate ? "Section details" : initialSection?.label ?? "Section details"}>
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
              label="Active section"
              checked={form.isActive}
              onChange={(checked) => setForm((previous) => ({ ...previous, isActive: checked }))}
            />
            <div className={ADMIN_ACTIONS_CLASS}>
              <Button type="submit" disabled={isLoading}>
                {isCreate ? "Create section" : "Save changes"}
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
          {statusMessage ? (
            <p className={joinAdminClassNames(ADMIN_STATUS_MESSAGE_CLASS, statusTone === "error" && ADMIN_STATUS_MESSAGE_ERROR_CLASS)}>{statusMessage}</p>
          ) : null}
        </FormSection>
      </Card>

      <DeleteConfirmModal
        isOpen={isDeleteDialogOpen}
        title="Delete section?"
        description={`This will remove ${initialSection?.label ?? "this section"} permanently. Delete only works when the section is no longer used by any categories.`}
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
  );
}
