"use client";

import {
  ADMIN_CHECKBOX_LABEL_MUTED_CLASS,
  ADMIN_FIELD_ERROR_CLASS,
  ADMIN_HOURS_SECTION_CLASS,
  ADMIN_LIST_GRID_CLASS,
  joinAdminClassNames
} from "@/components/admin/admin-tailwind";
import { CheckboxField, Field, SelectInput } from "@/components/ui";
import type { ListingCategorySectionProps } from "@/components/admin/listing-editor/types";

export default function ListingCategorySection({
  categories,
  form,
  availableCategoryOptions,
  onPrimaryCategoryChange,
  onToggleCategory,
  validationErrors
}: ListingCategorySectionProps) {
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
        <div className={joinAdminClassNames(ADMIN_LIST_GRID_CLASS, "adminCheckboxList")}>
          {availableCategoryOptions.map((category) => {
            const checked = form.categoryIds.includes(category.id);
            const isPrimary = form.primaryCategoryId === category.id;

            return (
              <CheckboxField
                key={category.id}
                label={
                  <span>
                    {category.label}
                    {isPrimary ? <span className={ADMIN_CHECKBOX_LABEL_MUTED_CLASS}> (primary)</span> : null}
                  </span>
                }
                checked={checked}
                disabled={isPrimary}
                onChange={(nextChecked) => onToggleCategory(category.id, nextChecked)}
              />
            );
          })}
        </div>
        {validationErrors?.categoryIds ? <p className={ADMIN_FIELD_ERROR_CLASS}>{validationErrors.categoryIds}</p> : null}
      </div>
    </>
  );
}
