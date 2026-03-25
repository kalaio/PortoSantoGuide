import type { ReactNode } from "react";
import SiteFooter from "@/app/(frontend)/components/SiteFooter";
import PublicSearchBar from "@/app/(frontend)/components/PublicSearchBar";
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
