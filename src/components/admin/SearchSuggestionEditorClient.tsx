"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import AdminFormActions, { ADMIN_ACTION_BUTTON_CLASS } from "@/components/admin/AdminFormActions";
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
} from "@/components/admin/admin-tailwind";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import { Card, Field, FormSection, SelectInput, TextInput } from "@/components/ui";

type Suggestion = {
  id: string;
  label: string;
  query: string;
  priority: number;
  isActive: boolean;
};

type ApiIssue = {
  path?: Array<string | number>;
  message?: string;
};

type ApiError = {
  error?: string;
  issues?: ApiIssue[];
};

type SuggestionFormState = {
  label: string;
  query: string;
  priority: string;
  isActive: boolean;
};

type SearchSuggestionEditorClientProps = {
  mode: "create" | "edit";
  initialSuggestion?: Suggestion;
};

type SuggestionValidationErrors = {
  label?: string;
  query?: string;
  priority?: string;
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

function toFormState(suggestion?: Suggestion): SuggestionFormState {
  return {
    label: suggestion?.label ?? "",
    query: suggestion?.query ?? "",
    priority: String(suggestion?.priority ?? 50),
    isActive: suggestion?.isActive ?? true
  };
}

function getValidationErrors(form: SuggestionFormState): SuggestionValidationErrors {
  const errors: SuggestionValidationErrors = {};

  if (form.label.trim().length === 0) {
    errors.label = "Label is required.";
  }

  if (form.query.trim().length === 0) {
    errors.query = "Query is required.";
  }

  if (form.priority.trim().length === 0) {
    errors.priority = "Priority is required.";
  }

  return errors;
}

export default function SearchSuggestionEditorClient({
  mode,
  initialSuggestion
}: SearchSuggestionEditorClientProps) {
  const router = useRouter();
  const isCreate = mode === "create";
  const [form, setForm] = useState<SuggestionFormState>(() => toFormState(initialSuggestion));
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

    const response = await fetch(
      isCreate
        ? "/api/admin/search-suggestions"
        : `/api/admin/search-suggestions/${initialSuggestion?.id ?? ""}`,
      {
        method: isCreate ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label,
          query: form.query,
          priority: Number(form.priority),
          isActive: form.isActive
        })
      }
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as ApiError;
      setStatusMessage(
        isCreate
          ? `Could not create suggestion. ${getIssueMessage(payload, "Unknown error")}`
          : `Could not update suggestion. ${getIssueMessage(payload, "Unknown error")}`
      );
      setStatusTone("error");
      setIsLoading(false);
      setActiveAction(null);
      return;
    }

    const payload = (await response.json()) as { data: Suggestion };

    if (isCreate) {
      setActiveAction(null);
      router.push(`/admin/search-suggestions/${payload.data.id}/edit`);
      return;
    }

    setForm(toFormState(payload.data));
    setStatusMessage("Suggestion updated.");
    setStatusTone("success");
    setIsLoading(false);
    setActiveAction(null);
    router.refresh();
  }

  async function onDeleteConfirmed() {
    if (!initialSuggestion) {
      return;
    }

    setActiveAction("delete");
    setIsLoading(true);
    setStatusMessage("");
    setStatusTone(null);

    const response = await fetch(`/api/admin/search-suggestions/${initialSuggestion.id}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as ApiError;
      setStatusMessage(`Could not delete suggestion. ${getIssueMessage(payload, "Unknown error")}`);
      setStatusTone("error");
      setIsDeleteDialogOpen(false);
      setIsLoading(false);
      setActiveAction(null);
      return;
    }

    setActiveAction(null);
    router.push("/admin/search-suggestions");
    router.refresh();
  }

  return (
    <main className={ADMIN_PAGE_CLASS}>
      <section className={ADMIN_HERO_CLASS}>
        <div className={ADMIN_HEADER_ROW_CLASS}>
          <h1 className={ADMIN_TITLE_CLASS}>{isCreate ? "New Search Suggestion" : "Edit Search Suggestion"}</h1>
          <div className={ADMIN_HEADER_ACTIONS_CLASS}>
            <Button color="secondary" size="md" href="/admin/search-suggestions">
              Back to Search Suggestions
            </Button>
          </div>
        </div>
        <p>
          {isCreate
            ? "Create a curated suggestion for the global search dropdown."
            : "Update priority and query behavior from a dedicated page."}
        </p>
        <p className={ADMIN_REQUIRED_LEGEND_CLASS}>Fields marked with * are required.</p>
      </section>

      <Card as="section">
        <FormSection title={isCreate ? "Suggestion details" : initialSuggestion?.label ?? "Suggestion details"}>
          <form className={ADMIN_FORM_CLASS} onSubmit={onSubmit} noValidate>
            <Field label="Label">
              <TextInput
                value={form.label}
                onChange={(value) => setForm((previous) => ({ ...previous, label: value }))}
                isInvalid={hasTriedSubmit && Boolean(validationErrors.label)}
                errorMessage={hasTriedSubmit ? validationErrors.label : undefined}
                required
              />
            </Field>
            <Field label="Query">
              <TextInput
                value={form.query}
                onChange={(value) => setForm((previous) => ({ ...previous, query: value }))}
                isInvalid={hasTriedSubmit && Boolean(validationErrors.query)}
                errorMessage={hasTriedSubmit ? validationErrors.query : undefined}
                required
              />
            </Field>
            <Field label="Priority">
              <TextInput
                type="number"
                min="0"
                max="1000"
                value={form.priority}
                onChange={(value) => setForm((previous) => ({ ...previous, priority: value }))}
                isInvalid={hasTriedSubmit && Boolean(validationErrors.priority)}
                errorMessage={hasTriedSubmit ? validationErrors.priority : undefined}
                required
              />
            </Field>
            <Field label="Status">
              <SelectInput
                value={form.isActive ? "true" : "false"}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, isActive: event.target.value === "true" }))
                }
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </SelectInput>
            </Field>
            <AdminFormActions
              primaryActions={
                <Button type="submit" size="md" isDisabled={isLoading} isLoading={isLoading && activeAction === "save"} className={ADMIN_ACTION_BUTTON_CLASS}>
                  {isCreate ? "Create suggestion" : "Save changes"}
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
        title="Delete suggestion?"
        description={`This will permanently delete ${initialSuggestion?.label ?? "this suggestion"}. This action cannot be undone.`}
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
