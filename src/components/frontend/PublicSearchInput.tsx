"use client";

import type { FocusEventHandler, Ref } from "react";
import { SearchMd, XClose } from "@untitledui/icons";
import { InputBase } from "@/components/base/input/input";
import { cx } from "@/utils/cx";

type PublicSearchInputVariant = "hero" | "header";

type PublicSearchInputProps = {
  className?: string;
  inputRef?: Ref<HTMLInputElement>;
  isMobile?: boolean;
  onChange: (value: string) => void;
  onClear?: () => void;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  placeholder: string;
  showClear?: boolean;
  value: string;
  variant?: PublicSearchInputVariant;
};

function getNormalizedInputValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const eventTarget = "target" in value ? value.target : undefined;
    if (eventTarget && typeof eventTarget === "object" && "value" in eventTarget && typeof eventTarget.value === "string") {
      return eventTarget.value;
    }

    const currentTarget = "currentTarget" in value ? value.currentTarget : undefined;
    if (currentTarget && typeof currentTarget === "object" && "value" in currentTarget && typeof currentTarget.value === "string") {
      return currentTarget.value;
    }
  }

  return "";
}

const INPUT_VARIANTS = {
  hero: {
    clearButton: "right-3 h-8 w-8 md:right-4 md:h-10 md:w-10",
    icon: "left-4 h-5 w-5 text-black md:left-5 md:h-6 md:w-6",
    input: "pl-[2.875rem] pr-4 md:pl-14 md:pr-4 text-md leading-none placeholder:text-black/38",
    inputWithClear: "pr-12 md:pr-16",
    wrapper: "h-14 md:h-16 rounded-full border-[1.5px] border-transparent bg-white"
  },
  header: {
    clearButton: "right-3 h-8 w-8",
    icon: "left-4 h-5 w-5 text-black",
    input: "pl-[2.875rem] pr-4 md:pl-12 text-md leading-none placeholder:text-black/36",
    inputWithClear: "pr-12",
    wrapper: "h-12 rounded-full border-transparent bg-white"
  },
  mobile: {
    clearButton: "right-2.5 h-8 w-8",
    icon: "left-4 h-5 w-5 text-black",
    input: "pl-[2.875rem] pr-4 text-md leading-none placeholder:text-black/34",
    inputWithClear: "pr-11",
    wrapper: "h-12 rounded-full border-2 border-[var(--psg-brand)] bg-white"
  }
} as const;

export default function PublicSearchInput({
  className,
  inputRef,
  isMobile = false,
  onChange,
  onClear,
  onFocus,
  placeholder,
  showClear = false,
  value,
  variant = "header"
}: PublicSearchInputProps) {
  const styles = isMobile ? INPUT_VARIANTS.mobile : INPUT_VARIANTS[variant];

  return (
    <div className={cx("relative", className)}>
      <div
        className={cx(
          "w-full rounded-full border !bg-white shadow-[inset_0_1px_2px_rgba(10,13,18,0.06)] transition-[border-color,background-color,box-shadow] duration-150 ease-out focus-within:border-[var(--psg-brand)] focus-within:shadow-[inset_0_1px_4px_rgba(10,13,18,0.14)]",
          styles.wrapper
        )}
      >
        <InputBase
          ref={inputRef}
          aria-label={placeholder}
          icon={SearchMd}
          iconClassName={styles.icon}
          inputClassName={cx(
            "h-full w-full appearance-none border-0 bg-transparent text-[var(--psg-text-primary)] shadow-none ring-0 outline-hidden placeholder:font-normal placeholder:text-black/35 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
            styles.input,
            showClear && styles.inputWithClear
          )}
          onChange={(nextValue) => {
            onChange(getNormalizedInputValue(nextValue));
          }}
          onFocus={onFocus}
          placeholder={placeholder}
          type="search"
          value={value}
          wrapperClassName="h-full !rounded-full !border-0 !bg-transparent !shadow-none !ring-0 ring-transparent focus-within:!ring-0 focus-within:ring-transparent"
        />
      </div>

      {showClear ? (
        <button
          aria-label="Clear search"
          className={cx(
            "absolute top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full bg-[var(--psg-accent-surface-soft)] text-black/55 transition hover:bg-[var(--psg-accent-surface-strong)] hover:text-black/75 cursor-pointer",
            styles.clearButton
          )}
          onClick={onClear}
          type="button"
        >
          <XClose className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
