import type { ReactNode } from "react";
import localFont from "next/font/local";
import SiteFooter from "@/app/(frontend)/components/SiteFooter";
import PublicSearchBar from "@/app/(frontend)/components/PublicSearchBar";
import { getPublicMenuLinks } from "@/lib/listings";

const plusJakartaSans = localFont({
  src: [
    {
      path: "../../../public/fonts/plus-jakarta-sans/plus-jakarta-sans-latin.woff2",
      weight: "400 700",
      style: "normal"
    }
  ],
  display: "swap",
  variable: "--font-plus-jakarta"
});

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const menuLinks = await getPublicMenuLinks();

  return (
    <div className={plusJakartaSans.variable}>
      <PublicSearchBar menuLinks={menuLinks} />
      {children}
      <SiteFooter />
    </div>
  );
}
