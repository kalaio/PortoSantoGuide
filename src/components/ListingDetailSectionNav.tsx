"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type ListingDetailSectionNavItem = {
  id: string;
  label: string;
};

type ListingDetailSectionNavProps = {
  items: ListingDetailSectionNavItem[];
  sentinelId?: string;
  title: string;
};

const STICKY_NAV_HEIGHT = 80;
const SHOW_STICKY_THRESHOLD = -12;
const HIDE_STICKY_THRESHOLD = 0;

function getScrollOffset() {
  return STICKY_NAV_HEIGHT + 16;
}

function renderNavItems(
  items: ListingDetailSectionNavItem[],
  activeId: string,
  itemRefs: Map<string, HTMLButtonElement>,
  onClick: (id: string) => void
) {
  return items.map((item) => (
    <button
      key={item.id}
      ref={(node) => {
        if (node) {
          itemRefs.set(item.id, node);
        } else {
          itemRefs.delete(item.id);
        }
      }}
      type="button"
      className={cn(
        "relative shrink-0 cursor-pointer px-0 py-3 text-sm font-semibold transition after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-black after:content-['']",
        activeId === item.id ? "text-black after:opacity-100" : "text-black/70 after:opacity-0 hover:text-black"
      )}
      onClick={() => onClick(item.id)}
    >
      {item.label}
    </button>
  ));
}

export default function ListingDetailSectionNav({ items, sentinelId, title }: ListingDetailSectionNavProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const [isStickyVisible, setIsStickyVisible] = useState(false);
  const itemRefs = useRef(new Map<string, HTMLButtonElement>());
  const itemsContainerRef = useRef<HTMLDivElement | null>(null);
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);

  useEffect(() => {
    if (!items.some((item) => item.id === activeId)) {
      setActiveId(items[0]?.id ?? "");
    }
  }, [activeId, items]);

  useEffect(() => {
    function updateStickyVisibility() {
      const sentinel = sentinelId ? document.getElementById(sentinelId) : null;

      if (!sentinel) {
        setIsStickyVisible(window.scrollY > 0);
        return;
      }

      const sentinelBottom = sentinel.getBoundingClientRect().bottom;

      setIsStickyVisible((currentValue) => {
        if (!currentValue && sentinelBottom <= SHOW_STICKY_THRESHOLD) {
          return true;
        }

        if (currentValue && sentinelBottom >= HIDE_STICKY_THRESHOLD) {
          return false;
        }

        return currentValue;
      });
    }

    updateStickyVisibility();
    window.addEventListener("scroll", updateStickyVisibility, { passive: true });
    window.addEventListener("resize", updateStickyVisibility);

    return () => {
      window.removeEventListener("scroll", updateStickyVisibility);
      window.removeEventListener("resize", updateStickyVisibility);
    };
  }, [sentinelId]);

  useEffect(() => {
    function updateActiveSection() {
      const currentY = window.scrollY + getScrollOffset();

      let nextActiveId = items[0]?.id ?? "";
      let currentTop = Number.NEGATIVE_INFINITY;

      items.forEach((item) => {
        const section = document.getElementById(item.id);
        if (!section) {
          return;
        }

        const sectionTop = section.getBoundingClientRect().top + window.scrollY;
        if (currentY >= sectionTop && sectionTop > currentTop) {
          currentTop = sectionTop;
          nextActiveId = item.id;
        }
      });

      setActiveId((currentValue) => (currentValue === nextActiveId ? currentValue : nextActiveId));
    }

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [items]);

  useEffect(() => {
    const activeItem = itemRefs.current.get(activeId);
    const itemsContainer = itemsContainerRef.current;
    if (!activeItem || !itemsContainer) {
      return;
    }

    const containerRect = itemsContainer.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();
    const isOutOfView = itemRect.left < containerRect.left || itemRect.right > containerRect.right;

    if (!isOutOfView) {
      return;
    }

    activeItem.scrollIntoView({
      behavior: typeof window !== "undefined" && window.innerWidth < 900 ? "smooth" : "auto",
      block: "nearest",
      inline: "center"
    });
  }, [activeId, isStickyVisible, itemIds]);

  function handleItemClick(id: string) {
    const section = document.getElementById(id);
    if (!section) {
      return;
    }

    const nextY = section.getBoundingClientRect().top + window.scrollY - getScrollOffset();
    window.scrollTo({ top: Math.max(0, nextY), behavior: "smooth" });
  }

  return isStickyVisible ? (
    <nav className="listingDetailStickyNav fixed inset-x-0 top-0 z-40 bg-white shadow-sm" aria-label="Listing sections">
      <div className="mx-auto w-full max-w-[1280px] px-4 md:px-5">
        <p className="truncate py-2 text-sm font-semibold text-black">{title}</p>
        <div className="border-t border-black/10">
          <div ref={itemsContainerRef} className="flex w-full gap-6 overflow-x-auto overflow-y-hidden px-0">
            {renderNavItems(items, activeId, itemRefs.current, handleItemClick)}
          </div>
        </div>
      </div>
    </nav>
  ) : null;
}
