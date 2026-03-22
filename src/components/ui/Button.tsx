import Link from "next/link";
import { forwardRef } from "react";
import type { ComponentProps, ComponentPropsWithoutRef, ReactNode } from "react";
import { buttonClassName, type ButtonStyleProps } from "@/components/ui/button-styles";

type ButtonProps = Omit<ComponentPropsWithoutRef<"button">, "className"> &
  ButtonStyleProps & {
    children: ReactNode;
  };

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "as"> & ButtonStyleProps;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, fullWidth, children, type = "button", disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClassName({ variant, size, className, fullWidth })}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
});

export function ButtonLink({ variant = "primary", size = "md", className, fullWidth, ...props }: ButtonLinkProps) {
  return <Link className={buttonClassName({ variant, size, className, fullWidth })} {...props} />;
}
