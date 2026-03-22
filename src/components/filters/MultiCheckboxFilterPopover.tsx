"use client";

import FilterPopover from "@/components/filters/FilterPopover";

type MultiCheckboxFilterOption = {
  value: string;
  label: string;
};

type MultiCheckboxFilterPopoverProps = {
  label: string;
  options: MultiCheckboxFilterOption[];
  value: string[];
  onChange: (next: string[]) => void;
};

function normalizeValues(values: string[], options: MultiCheckboxFilterOption[]) {
  const allowedValues = new Set(options.map((option) => option.value));

  return options.map((option) => option.value).filter((value) => allowedValues.has(value) && values.includes(value));
}

function cloneValues(values: string[]) {
  return [...values];
}

function getButtonLabel(label: string, value: string[], options: MultiCheckboxFilterOption[]) {
  if (value.length === 0) {
    return label;
  }

  const selectedLabels = options.filter((option) => value.includes(option.value)).map((option) => option.label);

  if (selectedLabels.length <= 2) {
    return `${label}: ${selectedLabels.join(", ")}`;
  }

  return `${label} (${selectedLabels.length})`;
}

export default function MultiCheckboxFilterPopover({
  label,
  options,
  value,
  onChange
}: MultiCheckboxFilterPopoverProps) {
  const normalizedValue = normalizeValues(value, options);

  return (
    <FilterPopover<string[]>
      applyLabel="Apply"
      areEqual={(left, right) => left.length === right.length && left.every((item, index) => item === right[index])}
      buttonLabel={getButtonLabel(label, normalizedValue, options)}
      clearLabel="Clear"
      clearValue={[]}
      cloneValue={cloneValues}
      isActive={normalizedValue.length > 0}
      normalizeDraft={(draft) => normalizeValues(draft, options)}
      onApply={onChange}
      popoverClassName="multiFilterPopover"
      value={normalizedValue}
    >
      {({ draftValue, setDraftWith }) => (
        <div className="multiFilterOptions" role="group" aria-label={label}>
          {options.map((option) => {
            const checked = draftValue.includes(option.value);

            return (
              <label key={option.value} className={`multiFilterOption${checked ? " isChecked" : ""}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    setDraftWith((previous) => {
                      const hasValue = previous.includes(option.value);

                      if (hasValue) {
                        return previous.filter((item) => item !== option.value);
                      }

                      return [...previous, option.value];
                    });
                  }}
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </FilterPopover>
  );
}
