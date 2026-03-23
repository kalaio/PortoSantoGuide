import type { ReactNode } from "react";
import { Badge as BaseBadge } from "@/components/base/badges/badges";

type BadgeTone = "neutral" | "success" | "danger";
type ExtendedBadgeTone = BadgeTone | "warning" | "primary";

type BadgeProps = {
  children: ReactNode;
  tone?: ExtendedBadgeTone;
  className?: string;
};

export default function Badge({ children, tone = "neutral", className }: BadgeProps) {
  const color =
    tone === "success"
      ? "success"
      : tone === "warning"
        ? "warning"
        : tone === "primary"
          ? "brand"
          : tone === "danger"
            ? "error"
            : "gray";

  return (
    <BaseBadge type="pill-color" size="sm" color={color} className={className}>
      {children}
    </BaseBadge>
  );
}
