import { type SVGProps } from "react";

type MaterialSymbolIconProps = SVGProps<SVGSVGElement> & {
  size?: number;
  title?: string;
};

export default function MaterialSymbolIcon({
  children,
  size = 24,
  title,
  ...props
}: MaterialSymbolIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      width={size}
      height={size}
      fill="currentColor"
      focusable="false"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}
