"use client";

import { buildMaterialSymbolsStylesheetUrl } from "@/lib/material-symbols";

type MaterialSymbolsStylesheetClientProps = {
  iconNames: Array<string | null | undefined>;
};

export default function MaterialSymbolsStylesheetClient({
  iconNames
}: MaterialSymbolsStylesheetClientProps) {
  const href = buildMaterialSymbolsStylesheetUrl(iconNames);
  if (!href) {
    return null;
  }

  return <link rel="stylesheet" href={href} />;
}
