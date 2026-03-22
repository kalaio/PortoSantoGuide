"use client";

import { Select, SelectItem, type Selection } from "@heroui/react";
import {
  ADMIN_CUISINE_SELECT_POPOVER_CLASS,
  ADMIN_CUISINE_SELECT_VALUE_CLASS,
  ADMIN_CUISINE_SELECT_VALUE_PLACEHOLDER_CLASS,
  ADMIN_SELECT_CLASS,
  ADMIN_SELECT_TRIGGER_CLASS,
  ADMIN_SELECT_VALUE_CLASS,
  joinAdminClassNames
} from "@/components/admin/admin-tailwind";
import { CUISINE_OPTIONS, getCuisineLabel } from "@/lib/cuisines";

type CuisineMultiSelectProps = {
  value: string[];
  onChange: (next: string[]) => void;
  required?: boolean;
  errorMessage?: string;
};

function getTriggerLabel(value: string[]) {
  if (value.length === 0) {
    return "Select cuisines";
  }

  const labels = value.map((item) => getCuisineLabel(item));

  if (labels.length <= 2) {
    return labels.join(", ");
  }

  return `${labels.length} cuisines selected`;
}

export default function CuisineMultiSelect({
  value,
  onChange,
  required = false,
  errorMessage
}: CuisineMultiSelectProps) {
  const selectedKeys = new Set(value);
  const isInvalid = required && value.length === 0 && Boolean(errorMessage);

  return (
    <Select
      aria-label="Select cuisines"
      className={joinAdminClassNames("uiSelect", ADMIN_SELECT_CLASS, "adminCuisineSelect")}
      classNames={{
        base: "w-full",
        mainWrapper: "w-full",
        trigger: joinAdminClassNames("uiSelectTrigger", ADMIN_SELECT_TRIGGER_CLASS),
        value: joinAdminClassNames(
          "uiSelectValue",
          ADMIN_SELECT_VALUE_CLASS,
          ADMIN_CUISINE_SELECT_VALUE_CLASS,
          value.length === 0 && ADMIN_CUISINE_SELECT_VALUE_PLACEHOLDER_CLASS
        ),
        popoverContent: ADMIN_CUISINE_SELECT_POPOVER_CLASS
      }}
      disallowEmptySelection={false}
      errorMessage={isInvalid ? errorMessage : undefined}
      fullWidth
      isInvalid={isInvalid}
      isRequired={required}
      maxListboxHeight={280}
      size="lg"
      placeholder="Select one or more cuisines"
      renderValue={() => getTriggerLabel(value)}
      selectedKeys={selectedKeys}
      showScrollIndicators
      selectionMode="multiple"
      scrollShadowProps={{ hideScrollBar: false, offset: 24 }}
      variant="bordered"
      radius="lg"
      onSelectionChange={(keys: Selection) => {
        if (keys === "all") {
          onChange(CUISINE_OPTIONS.map((option) => option.value));
          return;
        }

        onChange(CUISINE_OPTIONS.map((option) => option.value).filter((optionValue) => keys.has(optionValue)));
      }}
    >
      {CUISINE_OPTIONS.map((option) => (
        <SelectItem key={option.value} textValue={option.label}>
          {option.label}
        </SelectItem>
      ))}
    </Select>
  );
}
