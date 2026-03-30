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

const INPUT_VARIANTS = {
  hero: {
    clearButton: "right-4 h-10 w-10",
    icon: "left-5 h-6 w-6 text-black",
    input: "pl-15 pr-18 text-xl leading-none placeholder:text-black/38",
    wrapper: "h-[4.5rem] rounded-full border-[1.5px] border-white/70 bg-white/98"
  },
  header: {
    clearButton: "right-3 h-8 w-8",
    icon: "left-4 h-5 w-5 text-black",
    input: "pl-13 pr-14 text-lg leading-none placeholder:text-black/36",
    wrapper: "h-14 rounded-full border border-black/10 bg-white"
  },
  mobile: {
    clearButton: "right-2.5 h-8 w-8",
    icon: "left-3.5 h-5 w-5 text-black",
    input: "pl-12 pr-13 text-md leading-none placeholder:text-black/34",
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
      <InputBase
        ref={inputRef}
        aria-label={placeholder}
        icon={SearchMd}
        iconClassName={styles.icon}
        inputClassName={cx(
          "w-full text-[var(--psg-text-primary)] placeholder:font-normal placeholder:text-black/35",
          styles.input
        )}
        onChange={onChange}
        onFocus={onFocus}
        placeholder={placeholder}
        type="search"
        value={value}
        wrapperClassName={cx(
          "w-full rounded-full border bg-white shadow-none transition-[border-color,box-shadow,background-color] duration-150 ease-out focus-within:border-[var(--psg-brand)] focus-within:ring-2 focus-within:ring-[color:rgb(7_109_112_/_0.16)]",
          styles.wrapper
        )}
      />

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
