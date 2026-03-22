import {
  ADMIN_BUTTON_BASE_CLASS,
  ADMIN_BUTTON_DANGER_CLASS,
  ADMIN_BUTTON_FULL_CLASS,
  ADMIN_BUTTON_GHOST_CLASS,
  ADMIN_BUTTON_MD_CLASS,
  ADMIN_BUTTON_PRIMARY_CLASS,
  ADMIN_BUTTON_SECONDARY_CLASS,
  ADMIN_BUTTON_SM_CLASS,
  joinAdminClassNames
} from "@/components/admin/admin-tailwind";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "md" | "sm";

type ButtonStyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  fullWidth?: boolean;
};

function getVariantClassName(variant: ButtonVariant) {
  switch (variant) {
    case "secondary":
      return ADMIN_BUTTON_SECONDARY_CLASS;
    case "danger":
      return ADMIN_BUTTON_DANGER_CLASS;
    case "ghost":
      return ADMIN_BUTTON_GHOST_CLASS;
    default:
      return ADMIN_BUTTON_PRIMARY_CLASS;
  }
}

function getSizeClassName(size: ButtonSize) {
  return size === "sm" ? ADMIN_BUTTON_SM_CLASS : ADMIN_BUTTON_MD_CLASS;
}

export type { ButtonSize, ButtonStyleProps, ButtonVariant };

export function buttonClassName({
  variant = "primary",
  size = "md",
  className,
  fullWidth = false
}: ButtonStyleProps) {
  return joinAdminClassNames(
    "uiButton",
    ADMIN_BUTTON_BASE_CLASS,
    getVariantClassName(variant),
    getSizeClassName(size),
    fullWidth && ADMIN_BUTTON_FULL_CLASS,
    className ?? ""
  );
}
