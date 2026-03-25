import type { ReactNode } from "react";
import SiteFooter from "@/components/layout/SiteFooter";
import PublicSearchBar from "@/components/search/PublicSearchBar";
import { getPublicMenuLinks } from "@/lib/listings";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const menuLinks = await getPublicMenuLinks();

  return (
    <>
      <PublicSearchBar menuLinks={menuLinks} />
      {children}
      <SiteFooter />
    </>
  );
}
