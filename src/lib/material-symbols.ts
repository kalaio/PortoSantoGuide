export const MATERIAL_SYMBOL_ICON_NAME_PATTERN = /^[a-z0-9_]+$/;

export function normalizeMaterialSymbolIconName(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized || !MATERIAL_SYMBOL_ICON_NAME_PATTERN.test(normalized)) {
    return null;
  }

  return normalized;
}

export function buildMaterialSymbolsStylesheetUrl(
  iconNames: Array<string | null | undefined>
): string | null {
  const uniqueNames = [...new Set(iconNames.map(normalizeMaterialSymbolIconName).filter(Boolean))] as string[];

  if (uniqueNames.length === 0) {
    return null;
  }

  uniqueNames.sort((left, right) => left.localeCompare(right));
  const encodedIconNames = encodeURIComponent(uniqueNames.join(","));

  return `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=${encodedIconNames}`;
}

export function buildMaterialSymbolSvgUrl(iconName: string | null | undefined): string | null {
  const normalizedIconName = normalizeMaterialSymbolIconName(iconName);
  if (!normalizedIconName) {
    return null;
  }

  return `https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/${encodeURIComponent(normalizedIconName)}/wght200/24px.svg`;
}
