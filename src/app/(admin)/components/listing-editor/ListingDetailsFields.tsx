"use client";

import type { RefObject } from "react";
import {
  ADMIN_HOURS_SECTION_CLASS,
  ADMIN_HOURS_TITLE_CLASS,
  ADMIN_SECTION_TITLE_CLASS
} from "@/app/(admin)/components/admin-tailwind";
import FoodHoursEditor from "@/app/(admin)/components/FoodHoursEditor";
import CuisineMultiSelect from "@/app/(admin)/components/listing-editor/CuisineMultiSelect";
import ListingLocationSection from "@/app/(admin)/components/listing-editor/ListingLocationSection";
import { CheckboxField, Field, SelectInput, TextArea, TextInput } from "@/components/ui";
import type { ListingFormState } from "@/app/(admin)/components/listing-editor/types";
import type { ListingDetailsDraft } from "@/lib/listing-details-form";

type SchemaField = {
  fieldKey: string;
  sortOrder: number;
  isRequired: boolean;
};

type ListingDetailsFieldsProps = {
  schemaFields: SchemaField[];
  form: ListingFormState;
  onFormChange: (updater: (previous: ListingFormState) => ListingFormState) => void;
  mapNodeRef: RefObject<HTMLDivElement | null>;
  draft: ListingDetailsDraft;
  onChange: (next: ListingDetailsDraft) => void;
  validationErrors?: Partial<Record<string, string>>;
};

function renderSchemaField(
  field: SchemaField,
  form: ListingFormState,
  onFormChange: (updater: (previous: ListingFormState) => ListingFormState) => void,
  mapNodeRef: RefObject<HTMLDivElement | null>,
  draft: ListingDetailsDraft,
  onChange: (next: ListingDetailsDraft) => void,
  validationErrors: Partial<Record<string, string>>
) {
  switch (field.fieldKey) {
    case "description":
      return (
        <Field key={field.fieldKey} label="Description">
          <TextArea
            value={form.description}
            onChange={(value) => onFormChange((previous) => ({ ...previous, description: value }))}
            rows={4}
            minLength={field.isRequired ? 10 : undefined}
            isInvalid={Boolean(validationErrors.description)}
            errorMessage={validationErrors.description}
            required={field.isRequired}
          />
        </Field>
      );
    case "notes":
      return (
        <Field key={field.fieldKey} label="Notes">
          <TextArea
            value={draft.notes}
            onChange={(value) => onChange({ ...draft, notes: value })}
            rows={3}
            isInvalid={Boolean(validationErrors.notes)}
            errorMessage={validationErrors.notes}
            required={field.isRequired}
          />
        </Field>
      );
    case "location":
      return (
        <ListingLocationSection
          key={field.fieldKey}
          latitude={form.latitude}
          longitude={form.longitude}
          mapNodeRef={mapNodeRef}
          errorMessage={validationErrors.location}
          required={field.isRequired}
        />
      );
    case "openingHours":
      return (
        <div key={field.fieldKey} className={ADMIN_HOURS_SECTION_CLASS}>
          <p className={ADMIN_HOURS_TITLE_CLASS}>
            Weekly schedule
            {field.isRequired ? (
              <span className="uiRequiredMarker" aria-hidden="true">
                {" "}*
              </span>
            ) : null}
          </p>
          <FoodHoursEditor
            value={draft.openingHoursWeek}
            onChange={(openingHoursWeek) => onChange({ ...draft, openingHoursWeek })}
            errorMessage={validationErrors.openingHours}
          />
        </div>
      );
    case "cuisines":
      return (
        <Field key={field.fieldKey} label="Cuisines" hint="Select one or more cuisines">
          <CuisineMultiSelect
            value={draft.cuisines}
            onChange={(cuisines) => onChange({ ...draft, cuisines })}
            required={field.isRequired}
            errorMessage={validationErrors.cuisines}
          />
        </Field>
      );
    case "priceLevel":
      return (
        <Field key={field.fieldKey} label="Price level">
          <SelectInput
            value={draft.priceLevel}
            onChange={(event) =>
              onChange({
                ...draft,
                priceLevel: event.target.value as ListingDetailsDraft["priceLevel"]
              })
            }
            isInvalid={Boolean(validationErrors.priceLevel)}
            errorMessage={validationErrors.priceLevel}
            required={field.isRequired}
          >
            <option value="">Not set</option>
            <option value="budget">Budget</option>
            <option value="mid">Mid</option>
            <option value="premium">Premium</option>
          </SelectInput>
        </Field>
      );
    case "priceFrom":
      return (
        <Field key={field.fieldKey} label="Price from (EUR)">
          <TextInput
            type="number"
            min="0"
            value={draft.priceFrom}
            onChange={(value) => onChange({ ...draft, priceFrom: value })}
            isInvalid={Boolean(validationErrors.priceFrom)}
            errorMessage={validationErrors.priceFrom}
            required={field.isRequired}
          />
        </Field>
      );
    case "takeaway":
      return (
        <CheckboxField
          key={field.fieldKey}
          label="Takeaway available"
          checked={draft.takeaway}
          onChange={(checked) => onChange({ ...draft, takeaway: checked })}
        />
      );
    case "durationMinutes":
      return (
        <Field key={field.fieldKey} label="Duration (minutes)">
          <TextInput
            type="number"
            min="1"
            value={draft.durationMinutes}
            onChange={(value) => onChange({ ...draft, durationMinutes: value })}
            isInvalid={Boolean(validationErrors.durationMinutes)}
            errorMessage={validationErrors.durationMinutes}
            required={field.isRequired}
          />
        </Field>
      );
    case "difficulty":
      return (
        <Field key={field.fieldKey} label="Difficulty">
          <SelectInput
            value={draft.difficulty}
            onChange={(event) =>
              onChange({
                ...draft,
                difficulty: event.target.value as ListingDetailsDraft["difficulty"]
              })
            }
            isInvalid={Boolean(validationErrors.difficulty)}
            errorMessage={validationErrors.difficulty}
            required={field.isRequired}
          >
            <option value="">Not set</option>
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="hard">Hard</option>
          </SelectInput>
        </Field>
      );
    case "bookingRequired":
      return (
        <CheckboxField
          key={field.fieldKey}
          label="Booking required"
          checked={draft.bookingRequired}
          onChange={(checked) => onChange({ ...draft, bookingRequired: checked })}
        />
      );
    case "accessType":
      return (
        <Field key={field.fieldKey} label="Access type">
          <SelectInput
            value={draft.accessType}
            onChange={(event) =>
              onChange({
                ...draft,
                accessType: event.target.value as ListingDetailsDraft["accessType"]
              })
            }
            isInvalid={Boolean(validationErrors.accessType)}
            errorMessage={validationErrors.accessType}
            required={field.isRequired}
          >
            <option value="">Select access type</option>
            <option value="car">Car</option>
            <option value="walk">Walk</option>
            <option value="mixed">Mixed</option>
          </SelectInput>
        </Field>
      );
    case "bestTime":
      return (
        <Field key={field.fieldKey} label="Best time">
          <SelectInput
            value={draft.bestTime}
            onChange={(event) =>
              onChange({
                ...draft,
                bestTime: event.target.value as ListingDetailsDraft["bestTime"]
              })
            }
            isInvalid={Boolean(validationErrors.bestTime)}
            errorMessage={validationErrors.bestTime}
            required={field.isRequired}
          >
            <option value="">Select best time</option>
            <option value="sunrise">Sunrise</option>
            <option value="daytime">Daytime</option>
            <option value="sunset">Sunset</option>
            <option value="night">Night</option>
          </SelectInput>
        </Field>
      );
    case "hikeMinutes":
      return (
        <Field key={field.fieldKey} label="Walking time (minutes)">
          <TextInput
            type="number"
            min="0"
            value={draft.hikeMinutes}
            onChange={(value) => onChange({ ...draft, hikeMinutes: value })}
            isInvalid={Boolean(validationErrors.hikeMinutes)}
            errorMessage={validationErrors.hikeMinutes}
            required={field.isRequired}
          />
        </Field>
      );
    case "entryFee":
      return (
        <Field key={field.fieldKey} label="Entry fee (EUR)">
          <TextInput
            type="number"
            min="0"
            value={draft.entryFee}
            onChange={(value) => onChange({ ...draft, entryFee: value })}
            isInvalid={Boolean(validationErrors.entryFee)}
            errorMessage={validationErrors.entryFee}
            required={field.isRequired}
          />
        </Field>
      );
    default:
      return null;
  }
}

export default function ListingDetailsFields({
  schemaFields,
  form,
  onFormChange,
  mapNodeRef,
  draft,
  onChange,
  validationErrors = {}
}: ListingDetailsFieldsProps) {
  if (schemaFields.length === 0) {
    return null;
  }

  return (
    <>
      <h3 className={ADMIN_SECTION_TITLE_CLASS}>Schema fields</h3>
      {schemaFields.map((field) =>
        renderSchemaField(field, form, onFormChange, mapNodeRef, draft, onChange, validationErrors)
      )}
    </>
  );
}
