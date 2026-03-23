"use client";

import { useEffect, useMemo } from "react";
import type { Key } from "react-aria-components";
import { useListData } from "react-stately";
import { MultiSelect } from "@/components/base/select/multi-select";
import type { SelectItemType } from "@/components/base/select/select";
import { CUISINE_OPTIONS } from "@/lib/cuisines";

type CuisineMultiSelectProps = {
  value: string[];
  onChange: (next: string[]) => void;
  required?: boolean;
  errorMessage?: string;
};

const CUISINE_ITEMS: SelectItemType[] = CUISINE_OPTIONS.map((option) => ({
  id: option.value,
  label: option.label
}));

function toOrderedCuisineValues(keys: Iterable<string>) {
  const selectedKeys = new Set(keys);

  return CUISINE_OPTIONS.filter((option) => selectedKeys.has(option.value)).map((option) => option.value);
}

export default function CuisineMultiSelect({
  value,
  onChange,
  required = false,
  errorMessage
}: CuisineMultiSelectProps) {
  const isInvalid = required && value.length === 0 && Boolean(errorMessage);

  const selectedCuisineItems = useMemo(
    () => CUISINE_ITEMS.filter((item) => value.includes(item.id)),
    [value]
  );

  const selectedItems = useListData({
    initialItems: selectedCuisineItems
  });

  useEffect(() => {
    const currentIds = selectedItems.items.map((item) => item.id);

    if (
      currentIds.length === selectedCuisineItems.length &&
      currentIds.every((id, index) => id === selectedCuisineItems[index]?.id)
    ) {
      return;
    }

    for (const item of [...selectedItems.items]) {
      selectedItems.remove(item.id);
    }

    for (const item of selectedCuisineItems) {
      selectedItems.append(item);
    }
  }, [selectedCuisineItems, selectedItems]);

  const handleItemInserted = (key: Key) => {
    onChange(toOrderedCuisineValues([...value, String(key)]));
  };

  const handleItemCleared = (key: Key) => {
    onChange(toOrderedCuisineValues(value.filter((item) => item !== String(key))));
  };

  return (
    <MultiSelect
      items={CUISINE_ITEMS}
      selectedItems={selectedItems}
      size="md"
      placeholder="Search cuisines"
      placeholderIcon={null}
      isInvalid={isInvalid}
      hint={isInvalid ? errorMessage : undefined}
      onItemInserted={handleItemInserted}
      onItemCleared={handleItemCleared}
    >
      {(item) => <MultiSelect.Item id={item.id} label={item.label} />}
    </MultiSelect>
  );
}
