"use client";

import type { ReactNode } from "react";
import { Checkbox as AriaCheckbox, type CheckboxProps as AriaCheckboxProps } from "react-aria-components";
import { cx } from "@/utils/cx";

const SIZE_STYLES = {
  sm: {
    root: "h-9 px-3",
    label: "text-sm leading-5"
  },
  md: {
    root: "h-10 px-3.5",
    label: "text-sm leading-5"
  },
  lg: {
    root: "h-11 px-4",
    label: "text-md leading-6"
  },
  xl: {
    root: "h-12 px-4.5",
    label: "text-md leading-6"
  }
} as const;

type PublicFilterCheckboxProps = Omit<AriaCheckboxProps, "children"> & {
  className?: string | ((state: { isFocusVisible: boolean; isSelected: boolean }) => string);
  label: ReactNode;
  size?: keyof typeof SIZE_STYLES;
};

export default function PublicFilterCheckbox({ className, label, size = "md", ...props }: PublicFilterCheckboxProps) {
  return (
    <AriaCheckbox
      {...props}
      className={(state) =>
        cx(
          "inline-flex items-center rounded-full",
          SIZE_STYLES[size].root,
          typeof className === "function"
            ? className({ isFocusVisible: state.isFocusVisible, isSelected: state.isSelected })
            : className
        )
      }
    >
      <span className={cx("select-none px-0.5 font-medium", SIZE_STYLES[size].label)}>{label}</span>
    </AriaCheckbox>
  );
}
