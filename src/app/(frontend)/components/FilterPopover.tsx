"use client";

import { type ReactNode, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PublicFilterButton from "@/components/frontend/PublicFilterButton";
import { cn } from "@/lib/cn";

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
  const buttonRef = useRef<HTMLDivElement | null>(null);
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
  const [popoverPosition, setPopoverPosition] = useState({ left: 12, top: 12 });
  const [isPositionReady, setIsPositionReady] = useState(false);

  const updatePopoverPosition = useCallback(() => {
    if (!buttonRef.current || !popoverRef.current) {
      return false;
    }

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const popoverWidth = popoverRef.current.offsetWidth;
    const maxLeft = Math.max(12, window.innerWidth - popoverWidth - 12);

    setPopoverPosition({
      left: Math.min(Math.max(12, buttonRect.left), maxLeft),
      top: buttonRect.bottom + 12
    });
    setIsPositionReady(true);

    return true;
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setDraftValue(getDraft(value));
    }
  }, [getDraft, isOpen, value]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setIsPositionReady(false);
      return;
    }

    updatePopoverPosition();
  }, [isOpen, updatePopoverPosition]);

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
    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
    };
  }, [draftValue, getDraft, isEqual, isOpen, normalize, onApply, updatePopoverPosition, value]);

  return (
    <div className="relative">
      <div ref={buttonRef}>
        <PublicFilterButton
          className="cursor-pointer"
          isActive={isOpen || isActive}
          onClick={() => {
            if (isOpen) {
              setDraftValue(getDraft(value));
              setIsPositionReady(false);
              setIsOpen(false);
              return;
            }

            setDraftValue(getDraft(value));
            setIsPositionReady(false);
            setIsOpen(true);
          }}
          aria-expanded={isOpen}
          aria-controls={popoverId}
          size="md"
        >
          {buttonLabel}
        </PublicFilterButton>
      </div>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className={cn(
                "publicTheme fixed z-50 w-[min(22rem,calc(100vw-1.5rem))] rounded-[1.75rem] border border-black/8 bg-white p-4 shadow-[0_24px_60px_-28px_rgba(10,13,18,0.38)]",
                popoverClassName ?? ""
              )}
              id={popoverId}
              ref={popoverRef}
              style={{
                left: `${popoverPosition.left}px`,
                top: `${popoverPosition.top}px`,
                visibility: isPositionReady ? "visible" : "hidden"
              }}
            >
              {children({
                draftValue,
                setDraftValue,
                setDraftWith: (updater) => {
                  setDraftValue((previous) => updater(previous));
                }
              })}

              <div className="mt-4 flex items-center justify-between gap-3">
                <PublicFilterButton
                  className="cursor-pointer"
                  onClick={() => {
                    const nextValue = normalize(clearValue);
                    onApply(nextValue);
                    setDraftValue(getDraft(nextValue));
                  }}
                  size="md"
                  variant="ghost"
                >
                  {clearLabel}
                </PublicFilterButton>

                <PublicFilterButton
                  className="cursor-pointer"
                  onClick={() => {
                    const nextValue = normalize(draftValue);
                    onApply(nextValue);
                    setDraftValue(getDraft(nextValue));
                    setIsPositionReady(false);
                    setIsOpen(false);
                  }}
                  size="md"
                  variant="primary"
                >
                  {applyLabel}
                </PublicFilterButton>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
