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
    <header className="publicSearchBarRoot bg-[var(--psg-sand-shell)]">
      <div className="mx-auto grid h-[72px] w-full max-w-[1280px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-4 max-[900px]:h-16 max-[900px]:gap-3 md:px-5">
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
            className="block h-[72px] w-auto max-[900px]:h-16"
          />
        </Link>

        <div className="flex justify-center max-[640px]:hidden">
          <GlobalSearch />
        </div>

        <div className="flex items-center justify-end gap-1.5 max-[640px]:col-start-3 max-[640px]:gap-0.5">
          <div className="hidden max-[640px]:flex">
            <GlobalSearch compactOnMobile />
          </div>

          <button
            type="button"
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border-0 bg-transparent text-black transition hover:text-[var(--psg-brand)] cursor-pointer max-[900px]:h-11 max-[900px]:w-11"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu02 className="h-6 w-6 max-[900px]:h-5.5 max-[900px]:w-5.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} menuLinks={menuLinks} />
    </header>
  );
}
