"use client";

import type { ReactNode } from "react";
import { Checkbox as AriaCheckbox, type CheckboxProps as AriaCheckboxProps } from "react-aria-components";
import { cx } from "@/utils/cx";

const SIZE_STYLES = {
  sm: {
    root: "px-3 py-2",
    label: "text-sm"
  },
  md: {
    root: "px-3.5 py-2.5",
    label: "text-sm"
  },
  lg: {
    root: "px-4 py-2.5",
    label: "text-md"
  },
  xl: {
    root: "px-4.5 py-3",
    label: "text-md"
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
