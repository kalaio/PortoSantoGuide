"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

type PublicFilterButtonVariant = "trigger" | "primary" | "ghost";

type PublicFilterButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> & {
  children: ReactNode;
  className?: string;
  isActive?: boolean;
  variant?: PublicFilterButtonVariant;
};

export default function PublicFilterButton({
  children,
  className,
  isActive = false,
  variant = "trigger",
  type = "button",
  ...props
}: PublicFilterButtonProps) {
  if (variant === "primary") {
    return (
      <Button
        {...props}
        className={cx(
          "rounded-full border-0 bg-[var(--psg-brand)] px-5 py-3 text-base font-semibold text-white !shadow-none ring-0 before:hidden hover:bg-[var(--psg-brand-hover)] focus-visible:outline-[var(--psg-brand)]",
          className
        )}
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
          "rounded-full border-0 px-0 py-2 text-base font-semibold text-[color:var(--psg-text-secondary)] !shadow-none ring-0 before:hidden *:data-text:text-[color:var(--psg-text-secondary)] hover:bg-transparent hover:text-black hover:*:data-text:text-black focus-visible:outline-[var(--psg-brand)]",
          className
        )}
        color="tertiary"
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
        "min-h-12 rounded-full bg-white px-5 text-[1.0625rem] font-medium text-black !shadow-none ring-0 before:hidden *:data-text:text-black hover:*:data-text:text-black",
        isActive
          ? "border border-[var(--psg-brand)] ring-0 hover:bg-white hover:text-black"
          : "border border-black/10 ring-0 hover:border-[var(--psg-brand)] hover:bg-white hover:text-black",
        className
      )}
      color="secondary"
      type={type}
    >
      {children}
    </Button>
  );
}
