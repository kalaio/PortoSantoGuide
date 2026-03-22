import { buildMaterialSymbolsStylesheetUrl } from "@/lib/material-symbols";

type MaterialSymbolsStylesheetProps = {
  iconNames: Array<string | null | undefined>;
};

export default function MaterialSymbolsStylesheet({ iconNames }: MaterialSymbolsStylesheetProps) {
  const href = buildMaterialSymbolsStylesheetUrl(iconNames);
  if (!href) {
    return null;
  }

  return <link rel="stylesheet" href={href} />;
}
