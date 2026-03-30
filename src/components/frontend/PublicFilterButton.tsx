"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button } from "@/components/base/buttons/button";
import type { ButtonProps as BaseButtonProps } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

type PublicFilterButtonVariant = "trigger" | "primary" | "ghost";

type PublicFilterButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> & {
  children: ReactNode;
  className?: string;
  iconLeading?: BaseButtonProps["iconLeading"];
  iconTrailing?: BaseButtonProps["iconTrailing"];
  isActive?: boolean;
  size?: NonNullable<BaseButtonProps["size"]>;
  variant?: PublicFilterButtonVariant;
};

const CONTROL_TEXT_LEADING = {
  sm: "leading-5",
  md: "leading-5",
  lg: "leading-6",
  xl: "leading-6"
} as const;

export default function PublicFilterButton({
  children,
  className,
  iconLeading,
  iconTrailing,
  isActive = false,
  size = "md",
  variant = "trigger",
  type = "button",
  ...props
}: PublicFilterButtonProps) {
  if (variant === "primary") {
    return (
        <Button
          {...props}
          className={cx(
            "rounded-full border-0 bg-[var(--psg-brand)] text-white !shadow-none ring-0 before:hidden *:data-icon:text-white hover:bg-[var(--psg-brand-hover)] hover:*:data-icon:text-white focus-visible:outline-[var(--psg-brand)]",
            CONTROL_TEXT_LEADING[size],
            className
          )}
        iconLeading={iconLeading}
        iconTrailing={iconTrailing}
        size={size}
        type={type}
      >
        {children}
      </Button>
    );
  }

  if (variant === "ghost") {
    return (
      <Button
        {...props}
        className={cx(
          "rounded-full border-0 text-[color:var(--psg-text-secondary)] !shadow-none ring-0 before:hidden *:data-text:text-[color:var(--psg-text-secondary)] hover:bg-transparent hover:text-black hover:*:data-text:text-black focus-visible:outline-[var(--psg-brand)]",
          CONTROL_TEXT_LEADING[size],
          className
        )}
        color="tertiary"
        iconLeading={iconLeading}
        iconTrailing={iconTrailing}
        size={size}
        type={type}
      >
        {children}
      </Button>
    );
  }

  return (
    <Button
      {...props}
      className={cx(
        "rounded-full border-0 bg-white text-black !shadow-none before:hidden !font-medium *:data-text:font-medium *:data-text:text-black hover:*:data-text:text-black",
        CONTROL_TEXT_LEADING[size],
        isActive
          ? "!font-semibold bg-white text-[var(--psg-brand)] ring-1 ring-[var(--psg-brand)] ring-inset *:data-text:font-semibold *:data-text:text-[var(--psg-brand)] hover:bg-white hover:text-[var(--psg-brand)] hover:*:data-text:text-[var(--psg-brand)]"
          : "ring-1 ring-black/10 ring-inset hover:bg-black/[0.025] hover:text-black",
        className
      )}
      color="secondary"
      iconLeading={iconLeading}
      iconTrailing={iconTrailing}
      size={size}
      type={type}
    >
      {children}
    </Button>
  );
}
