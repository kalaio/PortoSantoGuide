"use client";

import { HeroUIProvider } from "@heroui/react";
import type { ReactNode } from "react";

export default function HeroUiRootProvider({ children }: { children: ReactNode }) {
  return <HeroUIProvider>{children}</HeroUIProvider>;
}
