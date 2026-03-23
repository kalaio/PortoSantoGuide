import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/utils/cx";

type CardElement = "section" | "article" | "div";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: CardElement;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export default function Card({
  as = "section",
  title,
  description,
  actions,
  className,
  children,
  ...props
}: CardProps) {
  const Element = as;

  return (
    <Element
      className={cx(
        "rounded-3xl border border-secondary bg-primary/90 shadow-xs backdrop-blur-[18px] max-[640px]:rounded-[20px]",
        className
      )}
      {...props}
    >
      {(title || description || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-secondary px-6 py-5 max-[640px]:px-5 max-[640px]:py-4">
          <div className="grid gap-1.5">
            {title ? <div className="text-lg font-semibold text-primary max-[640px]:text-md">{title}</div> : null}
            {description ? <p className="text-sm text-tertiary">{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      )}
      <div className="px-6 py-5 max-[640px]:px-5 max-[640px]:py-4">{children}</div>
    </Element>
  );
}
