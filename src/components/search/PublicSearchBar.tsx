"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import MenuIcon from "@/components/icons/material/MenuIcon";
import type { PublicMenuLink } from "@/lib/listings";

const GlobalSearch = dynamic(() => import("@/components/search/GlobalSearch"));
const MenuOverlay = dynamic(() => import("@/components/layout/MenuOverlay"));

export default function PublicSearchBar({ menuLinks }: { menuLinks: PublicMenuLink[] }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const isHomeRoute = pathname === "/";
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (isAdminRoute || isHomeRoute) {
    return null;
  }

  return (
    <header className="siteHeader">
      <div className="siteHeaderInner">
        <Link
          href="/"
          className="siteLogo"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("porto-santo-guide:reset"));
            }
          }}
        >
          <Image
            src="/branding/porto-santo-guide.svg"
            alt="Porto Santo Guide"
            width={64}
            height={56}
            className="siteLogoImg"
          />
        </Link>
        <div className="siteHeaderSearch">
          <GlobalSearch />
        </div>
        <button
          type="button"
          className="homeMenuButton"
          onClick={() => setIsMenuOpen(true)}
          aria-label="Open menu"
        >
          <MenuIcon aria-hidden="true" />
        </button>
      </div>
      <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} menuLinks={menuLinks} />
    </header>
  );
}
