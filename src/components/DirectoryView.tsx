"use client";

import { useEffect, useMemo, useState, type Ref } from "react";
import { Map01 } from "@untitledui/icons";
import Link from "next/link";
import PublicFilterButton from "@/components/frontend/PublicFilterButton";
import type { ListingMapHandle, MapBounds } from "@/components/ListingMap";
import ListingMapLazy from "@/components/ListingMapLazy";
import { cn } from "@/lib/cn";
import { getDetailsSummaryByFields } from "@/lib/listing-details";
import { getListingPath } from "@/lib/listing-path";
import type { Listing } from "@/types/listing";

type DirectoryViewProps = {
  hasVisibleFilters: boolean;
  isMobileViewport: boolean;
  mapHandleRef?: Ref<ListingMapHandle>;
  mappableListings: Listing[];
  mobileViewMode: "list" | "map";
  onHoverListingChange: (listingId: string | null) => void;
  onSearchInArea: (bounds: MapBounds) => void;
  onToggleMobileViewMode: () => void;
  showMap: boolean;
  visibleListings: Listing[];
};

export default function DirectoryView({
  hasVisibleFilters,
  isMobileViewport,
  mapHandleRef,
  mappableListings,
  mobileViewMode,
  onHoverListingChange,
  onSearchInArea,
  onToggleMobileViewMode,
  showMap,
  visibleListings,
}: DirectoryViewProps) {
  const isMobileMapMode = showMap && isMobileViewport && mobileViewMode === "map";
  const shouldRenderMobileMap = showMap && isMobileViewport;
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);
  const listingSummariesById = useMemo(() => {
    const summaries = new Map<string, string>();

    visibleListings.forEach((listing) => {
      summaries.set(listing.id, getDetailsSummaryByFields(listing.primaryCategory.schema?.fields, listing.details));
    });

    return summaries;
  }, [visibleListings]);

  useEffect(() => {
    if (hoveredListingId && !visibleListings.some((listing) => listing.id === hoveredListingId)) {
      setHoveredListingId(null);
      onHoverListingChange(null);
    }
  }, [hoveredListingId, onHoverListingChange, visibleListings]);

  return (
    <section className={cn(isMobileMapMode && "block")}>
      <aside className={cn(isMobileMapMode && "hidden")}>
        <div className="grid gap-3">
          {visibleListings.map((listing) => {
            const isActive = hoveredListingId === listing.id;
            const detailsSummary = listingSummariesById.get(listing.id) ?? "";

            return (
              <Link
                key={listing.id}
                className="block"
                href={getListingPath(listing)}
                onBlur={() => {
                  setHoveredListingId(null);
                  onHoverListingChange(null);
                }}
                onFocus={() => {
                  setHoveredListingId(listing.id);
                  onHoverListingChange(listing.id);
                }}
              >
                <article
                  className={cn(
                    "rounded-[1rem] border bg-white px-5 py-4 transition",
                    isActive ? "border-[var(--psg-brand)]" : "border-black/10 hover:border-[color:rgb(7_109_112_/_0.28)]"
                  )}
                  onMouseEnter={() => {
                    setHoveredListingId(listing.id);
                    onHoverListingChange(listing.id);
                  }}
                  onMouseLeave={() => {
                    setHoveredListingId(null);
                    onHoverListingChange(null);
                  }}
                >
                  <h3 className="m-0 text-md font-semibold text-black">{listing.title}</h3>
                  <p className="mt-1 text-sm text-[color:var(--psg-text-secondary)]">{listing.categories.map((item) => item.label).join(" · ")}</p>
                  {detailsSummary ? <p className="mt-1 text-sm text-[color:var(--psg-text-secondary)]">{detailsSummary}</p> : null}
                </article>
              </Link>
            );
          })}
          {visibleListings.length === 0 ? (
            <p className="rounded-[1rem] border border-dashed border-gray-300 bg-white px-5 py-8 text-md text-gray-500">
              No places in this area.
            </p>
          ) : null}
        </div>
      </aside>

      {shouldRenderMobileMap ? (
        <div
          className={cn(
            "min-h-[44rem] overflow-hidden bg-white",
            isMobileMapMode
              ? cn(
                  "max-[900px]:fixed max-[900px]:inset-x-0 max-[900px]:bottom-0 max-[900px]:z-20 max-[900px]:block max-[900px]:min-h-0 max-[900px]:rounded-none",
                  hasVisibleFilters ? "max-[900px]:top-[60px]" : "max-[900px]:top-0"
                )
              : "max-[900px]:hidden"
          )}
        >
          <ListingMapLazy isVisible={isMobileMapMode} mapHandleRef={mapHandleRef} mobileCardMode listings={mappableListings} onSearchInArea={onSearchInArea} />
        </div>
      ) : null}

      {showMap ? (
        <PublicFilterButton
          aria-label={mobileViewMode === "map" ? "Show list" : "Show map"}
          aria-pressed={mobileViewMode === "map"}
          className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-30 hidden min-w-[120px] -translate-x-1/2 justify-center border-0 bg-[var(--psg-brand-secondary)] px-8 text-white ring-0 *:data-text:text-white *:data-icon:text-white hover:bg-[var(--psg-brand-secondary-hover)] hover:text-white hover:*:data-text:text-white hover:*:data-icon:text-white max-[900px]:inline-flex"
          iconLeading={mobileViewMode === "map" ? undefined : Map01}
          onClick={onToggleMobileViewMode}
          size="md"
        >
          {mobileViewMode === "map" ? "List" : "Map"}
        </PublicFilterButton>
      ) : null}
    </section>
  );
}
