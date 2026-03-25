"use client";

import dynamic from "next/dynamic";
import { Menu02 } from "@untitledui/icons";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import type { PublicMenuLink } from "@/lib/listings";

const GlobalSearch = dynamic(() => import("@/app/(frontend)/components/GlobalSearch"));
const MenuOverlay = dynamic(() => import("@/app/(frontend)/components/MenuOverlay"));

export default function PublicSearchBar({ menuLinks }: { menuLinks: PublicMenuLink[] }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const isHomeRoute = pathname === "/";
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (isAdminRoute || isHomeRoute) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-secondary bg-primary/95 backdrop-blur">
      <div className="mx-auto grid h-20 w-full max-w-[1280px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-4 max-[900px]:h-16 max-[900px]:gap-3 md:px-5">
        <Link
          href="/"
          className="inline-flex items-center"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("porto-santo-guide:reset"));
            }
          }}
        >
          <Image
            src="/branding/porto-santo-guide.svg"
            alt="Porto Santo Guide"
            width={96}
            height={84}
            priority
            loading="eager"
            className="block h-20 w-auto max-[900px]:h-16"
          />
        </Link>

        <div className="flex justify-center">
          <GlobalSearch />
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-gray-700 transition hover:bg-white max-[900px]:h-10 max-[900px]:w-10"
          onClick={() => setIsMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu02 className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} menuLinks={menuLinks} />
    </header>
  );
}
