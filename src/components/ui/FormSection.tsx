import type { ReactNode } from "react";
import { cx } from "@/utils/cx";

type FormSectionProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
};

export default function FormSection({ title, description, actions, className, children }: FormSectionProps) {
  return (
    <section className={cx("grid gap-5", className)}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1.5">
          <h2 className="text-lg font-semibold text-primary max-[640px]:text-md">{title}</h2>
          {description ? <p className="text-sm text-tertiary">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </header>
      <div className="border-t border-secondary" />
      <div className="grid gap-5">{children}</div>
    </section>
  );
}
