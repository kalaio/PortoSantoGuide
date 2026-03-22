"use client";

import { type ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";

type FilterPopoverRenderArgs<T> = {
  draftValue: T;
  setDraftValue: (next: T) => void;
  setDraftWith: (updater: (previous: T) => T) => void;
};

type FilterPopoverProps<T> = {
  buttonLabel: string;
  value: T;
  clearValue: T;
  isActive: boolean;
  onApply: (next: T) => void;
  children: (args: FilterPopoverRenderArgs<T>) => ReactNode;
  normalizeDraft?: (value: T) => T;
  areEqual?: (left: T, right: T) => boolean;
  cloneValue?: (value: T) => T;
  applyLabel?: string;
  clearLabel?: string;
  popoverClassName?: string;
};

export default function FilterPopover<T>({
  buttonLabel,
  value,
  clearValue,
  isActive,
  onApply,
  children,
  normalizeDraft,
  areEqual,
  cloneValue,
  applyLabel = "Apply",
  clearLabel = "Clear",
  popoverClassName
}: FilterPopoverProps<T>) {
  const popoverId = useId();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const getDraft = useCallback((source: T) => (cloneValue ? cloneValue(source) : source), [cloneValue]);
  const normalize = useCallback(
    (source: T) => (normalizeDraft ? normalizeDraft(source) : source),
    [normalizeDraft]
  );
  const isEqual = useCallback(
    (left: T, right: T) => (areEqual ? areEqual(left, right) : left === right),
    [areEqual]
  );

  const [isOpen, setIsOpen] = useState(false);
  const [draftValue, setDraftValue] = useState<T>(() => getDraft(value));

  useEffect(() => {
    if (!isOpen) {
      setDraftValue(getDraft(value));
    }
  }, [getDraft, isOpen, value]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (popoverRef.current?.contains(target) || buttonRef.current?.contains(target)) {
        return;
      }

      const normalized = normalize(draftValue);
      if (!isEqual(normalized, value)) {
        onApply(normalized);
      }
      setDraftValue(getDraft(normalized));
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setDraftValue(getDraft(value));
      setIsOpen(false);
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [draftValue, getDraft, isEqual, isOpen, normalize, onApply, value]);

  return (
    <div className="filterItem">
      <button
        type="button"
        className={`filterButton${isOpen ? " isOpen" : ""}${isActive ? " isActive" : ""}`}
        onClick={() => {
          if (isOpen) {
            setDraftValue(getDraft(value));
            setIsOpen(false);
            return;
          }

          setDraftValue(getDraft(value));
          setIsOpen(true);
        }}
        ref={buttonRef}
        aria-expanded={isOpen}
        aria-controls={popoverId}
      >
        {buttonLabel}
      </button>

      {isOpen ? (
        <div className={["filterPopover", popoverClassName ?? ""].filter(Boolean).join(" ")} id={popoverId} ref={popoverRef}>
          {children({
            draftValue,
            setDraftValue,
            setDraftWith: (updater) => {
              setDraftValue((previous) => updater(previous));
            }
          })}

          <div className="filterFooter">
            <button
              type="button"
              className="filterClear"
              onClick={() => {
                const nextValue = normalize(clearValue);
                onApply(nextValue);
                setDraftValue(getDraft(nextValue));
              }}
            >
              {clearLabel}
            </button>

            <button
              type="button"
              className="filterApply"
              onClick={() => {
                const nextValue = normalize(draftValue);
                onApply(nextValue);
                setDraftValue(getDraft(nextValue));
                setIsOpen(false);
              }}
            >
              {applyLabel}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
