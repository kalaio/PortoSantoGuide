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
  isOpen?: boolean;
  onApply: (next: T) => void;
  onOpenChange?: (next: boolean) => void;
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
  isOpen: controlledIsOpen,
  onApply,
  onOpenChange,
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

  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const [draftValue, setDraftValue] = useState<T>(() => getDraft(value));
  const [popoverPosition, setPopoverPosition] = useState({ left: 12, top: 12 });
  const [isPositionReady, setIsPositionReady] = useState(false);
  const isOpen = controlledIsOpen ?? uncontrolledIsOpen;
  const previousIsOpenRef = useRef(isOpen);
  const closeIntentRef = useRef<"apply" | "discard" | null>(null);

  const setIsOpen = useCallback(
    (next: boolean) => {
      if (controlledIsOpen === undefined) {
        setUncontrolledIsOpen(next);
      }

      onOpenChange?.(next);
    },
    [controlledIsOpen, onOpenChange]
  );

  const applyDraftValue = useCallback(
    (source: T) => {
      const normalized = normalize(source);

      if (!isEqual(normalized, value)) {
        onApply(normalized);
      }

      setDraftValue(getDraft(normalized));
    },
    [getDraft, isEqual, normalize, onApply, value]
  );

  const discardDraftValue = useCallback(() => {
    setDraftValue(getDraft(value));
  }, [getDraft, value]);

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

  useEffect(() => {
    const previousIsOpen = previousIsOpenRef.current;

    if (previousIsOpen && !isOpen) {
      if (closeIntentRef.current === null && controlledIsOpen !== undefined) {
        applyDraftValue(draftValue);
      }

      closeIntentRef.current = null;
    }

    previousIsOpenRef.current = isOpen;
  }, [applyDraftValue, controlledIsOpen, draftValue, isOpen]);

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

      closeIntentRef.current = "apply";
      applyDraftValue(draftValue);
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      closeIntentRef.current = "discard";
      discardDraftValue();
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
  }, [applyDraftValue, discardDraftValue, draftValue, isOpen, setIsOpen, updatePopoverPosition]);

  return (
    <div className="relative">
      <div ref={buttonRef}>
        <PublicFilterButton
          className={cn(
            "cursor-pointer",
            isOpen && !isActive &&
              "text-[var(--psg-brand)] ring-1 ring-[var(--psg-brand)] ring-inset *:data-text:text-[var(--psg-brand)] hover:bg-white hover:text-[var(--psg-brand)] hover:*:data-text:text-[var(--psg-brand)]"
          )}
          isActive={isActive}
          onClick={() => {
            if (isOpen) {
              closeIntentRef.current = "discard";
              discardDraftValue();
              setIsPositionReady(false);
              setIsOpen(false);
              return;
            }

            closeIntentRef.current = null;
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
                    applyDraftValue(clearValue);
                  }}
                  size="md"
                  variant="ghost"
                >
                  {clearLabel}
                </PublicFilterButton>

                <PublicFilterButton
                  className="cursor-pointer"
                  onClick={() => {
                    closeIntentRef.current = "apply";
                    applyDraftValue(draftValue);
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
