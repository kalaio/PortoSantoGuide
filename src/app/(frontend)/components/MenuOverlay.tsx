"use client";

import Link from "next/link";
import { XClose } from "@untitledui/icons";
import { usePathname, useRouter } from "next/navigation";
import { type MouseEvent, useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import type { PublicMenuLink } from "@/lib/listings";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  menuLinks: PublicMenuLink[];
};

export default function MenuOverlay({ isOpen, onClose, menuLinks }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, startNavigation] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [routeAtClick, setRouteAtClick] = useState(pathname);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    previousFocusedElementRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!overlayRef.current) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        if (!isNavigating) {
          setPendingHref(null);
          onClose();
        }
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = Array.from(
        overlayRef.current.querySelectorAll<HTMLElement>(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
        )
      ).filter((element) => !element.hasAttribute("disabled") && element.tabIndex !== -1);

      if (focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusedElementRef.current?.focus();
    };
  }, [isNavigating, isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setPendingHref(null);
      setRouteAtClick(pathname);
    }
  }, [isOpen, pathname]);

  useEffect(() => {
    if (!pendingHref) {
      return;
    }

    if (pathname !== routeAtClick) {
      setPendingHref(null);
      setRouteAtClick(pathname);
      onClose();
    }
  }, [onClose, pathname, pendingHref, routeAtClick]);

  if (!isOpen) {
    return null;
  }

  const handleLinkClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();

    if (isNavigating) {
      return;
    }

    if (href === pathname) {
      setPendingHref(null);
      onClose();
      return;
    }

    setPendingHref(href);
    setRouteAtClick(pathname);

    startNavigation(() => {
      router.push(href);
    });
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[110] bg-secondary px-6 py-6 max-[640px]:px-4 max-[640px]:py-4"
      role="dialog"
      aria-modal="true"
      aria-busy={isNavigating}
    >
      <button
        ref={closeButtonRef}
        type="button"
        className="absolute right-6 top-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-gray-700 transition hover:bg-white cursor-pointer max-[640px]:right-4 max-[640px]:top-4"
        onClick={() => {
          setPendingHref(null);
          onClose();
        }}
        aria-label="Close menu"
      >
        <XClose className="h-5 w-5" aria-hidden="true" />
      </button>

      <nav className="mt-24 grid w-full max-w-[28rem] gap-3 max-[640px]:mt-20">
        {menuLinks.map((link) => {
          const isPending = pendingHref === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex min-h-[4rem] items-center justify-between rounded-3xl border border-gray-200 bg-white px-5 text-lg font-semibold text-brand-900 transition hover:border-brand-200 hover:bg-gray-25",
                isPending && "pointer-events-none border-gray-200 bg-gray-50"
              )}
              onClick={(event) => handleLinkClick(event, link.href)}
              aria-disabled={isNavigating}
            >
              <span>{link.label}</span>
              {isPending ? <span className="routeSpinner" aria-hidden="true" /> : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
