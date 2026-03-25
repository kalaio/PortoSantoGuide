"use client";

import { Field, SelectInput, TextInput } from "@/components/ui";
import type { ListingFormState } from "@/app/(admin)/components/listing-editor/types";

type ListingCoreFieldsProps = {
  form: ListingFormState;
  onChange: (updater: (previous: ListingFormState) => ListingFormState) => void;
  disableStatus?: boolean;
  validationErrors?: {
    slug?: string;
    title?: string;
  };
};

export default function ListingCoreFields({
  form,
  onChange,
  disableStatus = false,
  validationErrors = {}
}: ListingCoreFieldsProps) {
  return (
    <>
      <Field label="Slug">
        <TextInput
          value={form.slug}
          onChange={(value) => onChange((previous) => ({ ...previous, slug: value }))}
          isInvalid={Boolean(validationErrors.slug)}
          errorMessage={validationErrors.slug}
          required
        />
      </Field>
      <Field label="Title">
        <TextInput
          value={form.title}
          onChange={(value) => onChange((previous) => ({ ...previous, title: value }))}
          isInvalid={Boolean(validationErrors.title)}
          errorMessage={validationErrors.title}
          required
        />
      </Field>
      <Field label="Status">
        <SelectInput
          value={form.status}
          onChange={(event) =>
            onChange((previous) => ({ ...previous, status: event.target.value as typeof previous.status }))
          }
          disabled={disableStatus}
          required
        >
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </SelectInput>
      </Field>
    </>
  );
}
