"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import AdminFormActions, { ADMIN_ACTION_BUTTON_CLASS } from "@/app/(admin)/components/AdminFormActions";
import { Button } from "@/components/base/buttons/button";
import {
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
} from "@/app/(admin)/components/admin-tailwind";
import DeleteConfirmModal from "@/app/(admin)/components/DeleteConfirmModal";
import { Card, CheckboxField, Field, FormSection, TextInput } from "@/components/ui";
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
  const [activeAction, setActiveAction] = useState<"save" | "delete" | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState<"error" | "success" | null>(null);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as ApiError;
      setStatusMessage(
        isCreate
          ? `Could not create section. ${getIssueMessage(payload, "Unknown error")}`
          : `Could not update section. ${getIssueMessage(payload, "Unknown error")}`
      );
      setStatusTone("error");
      setIsLoading(false);
      setActiveAction(null);
      return;
    }

    const payload = (await response.json()) as { data: AdminSectionRecord };

    if (isCreate) {
      setActiveAction(null);
      router.push(`/admin/sections/${payload.data.id}/edit`);
      return;
    }

    setForm(toFormState(payload.data));
    setStatusMessage("Section updated.");
    setStatusTone("success");
    setIsLoading(false);
    setActiveAction(null);
    router.refresh();
  }

  async function onDeleteConfirmed() {
    if (!initialSection) {
      return;
    }

    setActiveAction("delete");
    setIsLoading(true);
    setStatusMessage("");
    setStatusTone(null);

    const response = await fetch(`/api/admin/sections/${initialSection.id}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as ApiError;
      setStatusMessage(`Could not delete section. ${getIssueMessage(payload, "Unknown error")}`);
      setStatusTone("error");
      setIsDeleteDialogOpen(false);
      setIsLoading(false);
      setActiveAction(null);
      return;
    }

    setActiveAction(null);
    router.push("/admin/sections");
    router.refresh();
  }

  return (
    <main className={ADMIN_PAGE_CLASS}>
      <section className={ADMIN_HERO_CLASS}>
        <div className={ADMIN_HEADER_ROW_CLASS}>
          <h1 className={ADMIN_TITLE_CLASS}>{isCreate ? "New Section" : "Edit Section"}</h1>
          <div className={ADMIN_HEADER_ACTIONS_CLASS}>
            <Button color="secondary" size="md" href="/admin/sections">
              Back to Sections
            </Button>
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
            <Field label="Sort order">
              <TextInput
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(value) => setForm((previous) => ({ ...previous, sortOrder: value }))}
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
            <AdminFormActions
              primaryActions={
                <Button type="submit" size="md" isDisabled={isLoading} isLoading={isLoading && activeAction === "save"} className={ADMIN_ACTION_BUTTON_CLASS}>
                  {isCreate ? "Create section" : "Save changes"}
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
        title="Delete section?"
        description={`This will permanently delete ${initialSection?.label ?? "this section"}. This action cannot be undone. Delete only works when the section is no longer used by any categories.`}
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
