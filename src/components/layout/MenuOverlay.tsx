"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type MouseEvent, useEffect, useRef, useState, useTransition } from "react";
import CloseIcon from "@/components/icons/material/CloseIcon";
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
    <div ref={overlayRef} className="homeMenuOverlay" role="dialog" aria-modal="true" aria-busy={isNavigating}>
      <button
        ref={closeButtonRef}
        type="button"
        className="homeMenuClose"
        onClick={() => {
          setPendingHref(null);
          onClose();
        }}
        aria-label="Close menu"
      >
        <CloseIcon aria-hidden="true" />
      </button>
      <nav className="homeMenuNav">
        {menuLinks.map((link) => {
          const isPending = pendingHref === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`homeMenuLink${isPending ? " isPending" : ""}`}
              onClick={(event) => handleLinkClick(event, link.href)}
              aria-disabled={isNavigating}
            >
              <span className="homeMenuLinkLabel">{link.label}</span>
              {isPending ? <span className="routeSpinner" aria-hidden="true" /> : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
