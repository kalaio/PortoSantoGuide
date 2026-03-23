import type { SVGProps } from "react";
import { renderUiIcon } from "@/lib/ui-icons";

type ProjectIconProps = SVGProps<SVGSVGElement> & {
  iconName?: string | null;
};

export default function ProjectIcon({ iconName, ...props }: ProjectIconProps) {
  return renderUiIcon(iconName, props);
}
