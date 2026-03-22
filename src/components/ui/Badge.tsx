import type { ReactNode } from "react";
import { joinAdminClassNames } from "@/components/admin/admin-tailwind";

type BadgeTone = "neutral" | "success" | "danger";

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
};

export default function Badge({ children, tone = "neutral", className }: BadgeProps) {
  const toneClassName =
    tone === "success"
      ? "bg-[rgba(34,197,94,0.12)] text-[color:var(--success)]"
      : tone === "danger"
        ? "bg-[hsla(var(--danger-h),var(--danger-s),var(--danger-l),0.12)] text-[color:var(--danger)]"
        : "bg-[rgba(15,23,42,0.08)] text-[color:var(--admin-muted)]";

  return (
    <span
      className={joinAdminClassNames(
        "inline-flex min-h-[30px] items-center justify-center whitespace-nowrap rounded-full px-2.5 text-[0.78rem] font-bold tracking-[0.01em]",
        toneClassName,
        className ?? ""
      )}
    >
      {children}
    </span>
  );
}
