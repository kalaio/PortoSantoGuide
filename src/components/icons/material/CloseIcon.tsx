import { type SVGProps } from "react";
import MaterialSymbolIcon from "@/components/icons/material/MaterialSymbolIcon";

export default function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <MaterialSymbolIcon {...props}>
      <path d="M256-227.69 227.69-256l224-224-224-224L256-732.31l224 224 224-224L732.31-704l-224 224 224 224L704-227.69l-224-224-224 224Z" />
    </MaterialSymbolIcon>
  );
}
