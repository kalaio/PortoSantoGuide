"use client";

import { CheckboxGroup } from "react-aria-components";
import {
  ADMIN_CHECKBOX_LABEL_MUTED_CLASS,
  ADMIN_FIELD_ERROR_CLASS,
  ADMIN_HOURS_SECTION_CLASS,
  ADMIN_CHECKBOX_LABEL_CLASS,
  joinAdminClassNames
} from "@/app/(admin)/components/admin-tailwind";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Field, SelectInput } from "@/components/ui";
import type { ListingCategorySectionProps } from "@/app/(admin)/components/listing-editor/types";

export default function ListingCategorySection({
  categories,
  form,
  availableCategoryOptions,
  onPrimaryCategoryChange,
  onToggleCategory,
  validationErrors
}: ListingCategorySectionProps) {
  const categoryIdsErrorId = "listing-category-ids-error";

  function handleCategoryGroupChange(nextCategoryIds: string[]) {
    const nextValues = new Set(nextCategoryIds);

    for (const category of availableCategoryOptions) {
      if (category.id === form.primaryCategoryId) {
        continue;
      }

      const wasSelected = form.categoryIds.includes(category.id);
      const isSelected = nextValues.has(category.id);

      if (wasSelected !== isSelected) {
        onToggleCategory(category.id, isSelected);
      }
    }
  }

  return (
    <>
      <Field label="Primary category (canonical URL)">
        <SelectInput
          value={form.primaryCategoryId}
          onChange={(event) => onPrimaryCategoryChange(event.target.value)}
          isInvalid={Boolean(validationErrors?.primaryCategoryId)}
          errorMessage={validationErrors?.primaryCategoryId}
          required
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.section.label} · {category.label}
            </option>
          ))}
        </SelectInput>
      </Field>

      <div className={ADMIN_HOURS_SECTION_CLASS}>
        <p className="muted">Additional categories (same section)</p>
        <CheckboxGroup
          aria-label="Additional categories"
          value={form.categoryIds}
          onChange={handleCategoryGroupChange}
          isInvalid={Boolean(validationErrors?.categoryIds)}
          aria-describedby={validationErrors?.categoryIds ? categoryIdsErrorId : undefined}
          className="grid gap-3"
        >
          <div className="flex flex-wrap gap-x-5 gap-y-3">
            {availableCategoryOptions.map((category) => {
              const isPrimary = form.primaryCategoryId === category.id;

              return (
                <Checkbox
                  key={category.id}
                  value={category.id}
                  size="md"
                  isDisabled={isPrimary}
                  className="max-w-full"
                  label={
                    <span className={joinAdminClassNames(ADMIN_CHECKBOX_LABEL_CLASS, "max-w-full") }>
                      {category.label}
                      {isPrimary ? <span className={ADMIN_CHECKBOX_LABEL_MUTED_CLASS}> (primary)</span> : null}
                    </span>
                  }
                />
              );
            })}
          </div>
        </CheckboxGroup>
        {validationErrors?.categoryIds ? <p id={categoryIdsErrorId} className={ADMIN_FIELD_ERROR_CLASS}>{validationErrors.categoryIds}</p> : null}
      </div>
    </>
  );
}
