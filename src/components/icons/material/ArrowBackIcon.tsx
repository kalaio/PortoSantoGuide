import { type SVGProps } from "react";
import MaterialSymbolIcon from "@/components/icons/material/MaterialSymbolIcon";

export default function ArrowBackIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <MaterialSymbolIcon {...props}>
      <path d="m276.85-460 231.69 231.69L480-200 200-480l280-280 28.54 28.31L276.85-500H760v40H276.85Z" />
    </MaterialSymbolIcon>
  );
}
