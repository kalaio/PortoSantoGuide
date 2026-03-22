"use client";

import { useMemo } from "react";
import FilterPopover from "@/components/filters/FilterPopover";

export type NumericRange = {
  min: number;
  max: number;
};

type RangeFilterPopoverProps = {
  label: string;
  value: NumericRange;
  bounds: NumericRange;
  onChange: (next: NumericRange) => void;
  step?: number;
  showSlider?: boolean;
  showInputs?: boolean;
  formatValue?: (value: number) => string;
};

function normalizeNumericRange(range: NumericRange, bounds: NumericRange): NumericRange {
  const min = Math.max(bounds.min, Math.min(bounds.max, range.min));
  const max = Math.max(bounds.min, Math.min(bounds.max, range.max));

  if (min > max) {
    return { min: max, max: min };
  }

  return { min, max };
}

function cloneNumericRange(range: NumericRange): NumericRange {
  return { min: range.min, max: range.max };
}

export default function RangeFilterPopover({
  label,
  value,
  bounds,
  onChange,
  step = 1,
  showSlider = true,
  showInputs = true,
  formatValue = (numeric) => String(numeric)
}: RangeFilterPopoverProps) {
  const normalizedBounds = useMemo(() => normalizeNumericRange(bounds, bounds), [bounds]);
  const normalizedValue = useMemo(
    () => normalizeNumericRange(value, normalizedBounds),
    [normalizedBounds, value]
  );

  const isActive =
    normalizedValue.min !== normalizedBounds.min || normalizedValue.max !== normalizedBounds.max;

  const buttonLabel = isActive
    ? `${label} ${formatValue(normalizedValue.min)} - ${formatValue(normalizedValue.max)}`
    : label;

  const rangeSpan = Math.max(1, normalizedBounds.max - normalizedBounds.min);

  return (
    <FilterPopover<NumericRange>
      buttonLabel={buttonLabel}
      value={normalizedValue}
      clearValue={normalizedBounds}
      isActive={isActive}
      onApply={onChange}
      normalizeDraft={(draft) => normalizeNumericRange(draft, normalizedBounds)}
      areEqual={(left, right) => left.min === right.min && left.max === right.max}
      cloneValue={cloneNumericRange}
    >
      {({ draftValue, setDraftWith }) => {
        const draftRange = normalizeNumericRange(draftValue, normalizedBounds);
        const draftMinPercent = ((draftRange.min - normalizedBounds.min) / rangeSpan) * 100;
        const draftMaxPercent = ((draftRange.max - normalizedBounds.min) / rangeSpan) * 100;
        const draftFillLeft = Math.min(100, Math.max(0, Math.min(draftMinPercent, draftMaxPercent)));
        const draftFillRight = 100 - Math.min(100, Math.max(0, Math.max(draftMinPercent, draftMaxPercent)));

        return (
          <>
            {showSlider ? (
              <div className="priceRangeSliders">
                <div className="priceRangeTrack">
                  <div
                    className="priceRangeFill"
                    style={{ left: `${draftFillLeft}%`, right: `${draftFillRight}%` }}
                  />
                </div>

                <input
                  type="range"
                  min={normalizedBounds.min}
                  max={normalizedBounds.max}
                  step={step}
                  value={draftRange.min}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value);
                    if (!Number.isFinite(nextValue)) {
                      return;
                    }

                    setDraftWith((previous) => {
                      const normalizedPrevious = normalizeNumericRange(previous, normalizedBounds);
                      return {
                        ...normalizedPrevious,
                        min: Math.min(nextValue, normalizedPrevious.max)
                      };
                    });
                  }}
                />

                <input
                  type="range"
                  min={normalizedBounds.min}
                  max={normalizedBounds.max}
                  step={step}
                  value={draftRange.max}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value);
                    if (!Number.isFinite(nextValue)) {
                      return;
                    }

                    setDraftWith((previous) => {
                      const normalizedPrevious = normalizeNumericRange(previous, normalizedBounds);
                      return {
                        ...normalizedPrevious,
                        max: Math.max(nextValue, normalizedPrevious.min)
                      };
                    });
                  }}
                />
              </div>
            ) : null}

            {showInputs ? (
              <div className="priceRangeInputs">
                <label>
                  <span>Min</span>
                  <input
                    type="number"
                    min={normalizedBounds.min}
                    max={normalizedBounds.max}
                    step={step}
                    value={draftRange.min}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value);
                      if (!Number.isFinite(nextValue)) {
                        return;
                      }

                      setDraftWith((previous) => {
                        const normalizedPrevious = normalizeNumericRange(previous, normalizedBounds);
                        return {
                          ...normalizedPrevious,
                          min: nextValue
                        };
                      });
                    }}
                  />
                </label>

                <label>
                  <span>Max</span>
                  <input
                    type="number"
                    min={normalizedBounds.min}
                    max={normalizedBounds.max}
                    step={step}
                    value={draftRange.max}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value);
                      if (!Number.isFinite(nextValue)) {
                        return;
                      }

                      setDraftWith((previous) => {
                        const normalizedPrevious = normalizeNumericRange(previous, normalizedBounds);
                        return {
                          ...normalizedPrevious,
                          max: nextValue
                        };
                      });
                    }}
                  />
                </label>
              </div>
            ) : null}
          </>
        );
      }}
    </FilterPopover>
  );
}
