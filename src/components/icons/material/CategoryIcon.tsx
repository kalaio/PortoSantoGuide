import { normalizeMaterialSymbolIconName } from "@/lib/material-symbols";

type CategoryIconProps = {
  iconName?: string | null;
  className?: string;
};

export default function CategoryIcon({ iconName, className }: CategoryIconProps) {
  const normalizedIconName = normalizeMaterialSymbolIconName(iconName);
  if (!normalizedIconName) {
    return null;
  }

  return (
    <span className={`material-symbols-outlined${className ? ` ${className}` : ""}`} aria-hidden="true">
      {normalizedIconName}
    </span>
  );
}
