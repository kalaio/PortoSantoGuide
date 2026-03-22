import type { ReactNode } from "react";
import HeroUiRootProvider from "@/components/providers/HeroUiRootProvider";

export default function AdminLoginLayout({ children }: { children: ReactNode }) {
  return <HeroUiRootProvider>{children}</HeroUiRootProvider>;
}
