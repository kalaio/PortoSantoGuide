"use client";

import type { ReactNode } from "react";
import { Checkbox as AriaCheckbox, type CheckboxProps as AriaCheckboxProps } from "react-aria-components";
import { cx } from "@/utils/cx";

type PublicFilterCheckboxProps = Omit<AriaCheckboxProps, "children"> & {
  className?: string | ((state: { isFocusVisible: boolean; isSelected: boolean }) => string);
  label: ReactNode;
};

export default function PublicFilterCheckbox({ className, label, ...props }: PublicFilterCheckboxProps) {
  return (
    <AriaCheckbox
      {...props}
      className={(state) =>
        cx(
          "inline-flex items-center",
          typeof className === "function"
            ? className({ isFocusVisible: state.isFocusVisible, isSelected: state.isSelected })
            : className
        )
      }
    >
      <span className="select-none text-[1.0625rem] font-medium">{label}</span>
    </AriaCheckbox>
  );
}
