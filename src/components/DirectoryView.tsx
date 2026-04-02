"use client";

import Link from "next/link";
import PublicFilterButton from "@/components/frontend/PublicFilterButton";
import type { MapBounds } from "@/components/ListingMap";
import ListingMapLazy from "@/components/ListingMapLazy";
import { cn } from "@/lib/cn";
import { getDetailsSummaryByFields } from "@/lib/listing-details";
import { getListingPath } from "@/lib/listing-path";
import type { Listing } from "@/types/listing";

type DirectoryViewProps = {
  hasVisibleFilters: boolean;
  hoveredListingId: string | null;
  isMobileViewport: boolean;
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
  hoveredListingId,
  isMobileViewport,
  mappableListings,
  mobileViewMode,
  onHoverListingChange,
  onSearchInArea,
  onToggleMobileViewMode,
  showMap,
  visibleListings,
}: DirectoryViewProps) {
  const isMobileMapMode = showMap && isMobileViewport && mobileViewMode === "map";

  return (
    <section
      className={cn(
        "grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(21rem,38rem)]",
        !showMap && "grid-cols-1",
        isMobileMapMode && "block"
      )}
    >
      <aside className={cn(isMobileMapMode && "hidden")}>
        <div className="grid gap-3">
          {visibleListings.map((listing) => {
            const isActive = hoveredListingId === listing.id;
            const detailsSummary = getDetailsSummaryByFields(listing.primaryCategory.schema?.fields, listing.details);

            return (
              <Link
                key={listing.id}
                className="block"
                href={getListingPath(listing)}
                onBlur={() => onHoverListingChange(null)}
                onFocus={() => onHoverListingChange(listing.id)}
              >
                <article
                  className={cn(
                    "rounded-[1.5rem] border bg-white px-5 py-4 transition",
                    isActive ? "border-[var(--psg-brand)]" : "border-black/10 hover:border-[color:rgb(7_109_112_/_0.28)]"
                  )}
                  onMouseEnter={() => onHoverListingChange(listing.id)}
                  onMouseLeave={() => onHoverListingChange(null)}
                >
                  <h3 className="m-0 text-md font-semibold text-black">{listing.title}</h3>
                  <p className="mt-1 text-sm text-[color:var(--psg-text-secondary)]">{listing.categories.map((item) => item.label).join(" · ")}</p>
                  {detailsSummary ? <p className="mt-1 text-sm text-[color:var(--psg-text-secondary)]">{detailsSummary}</p> : null}
                </article>
              </Link>
            );
          })}
          {visibleListings.length === 0 ? (
            <p className="rounded-[1.5rem] border border-dashed border-gray-300 bg-white px-5 py-8 text-md text-gray-500">
              No places in this area.
            </p>
          ) : null}
        </div>
      </aside>

      {showMap ? (
        <div
          className={cn(
            "min-h-[44rem] overflow-hidden rounded-[1.75rem] border border-black/10 bg-white lg:self-start",
            isMobileMapMode
              ? cn(
                  "max-[900px]:fixed max-[900px]:inset-x-0 max-[900px]:bottom-0 max-[900px]:z-20 max-[900px]:block max-[900px]:min-h-0 max-[900px]:rounded-none max-[900px]:border-x-0 max-[900px]:border-b-0",
                  hasVisibleFilters ? "max-[900px]:top-[60px]" : "max-[900px]:top-0"
                )
              : "max-[900px]:hidden",
            !isMobileMapMode &&
              (hasVisibleFilters
                ? "lg:sticky lg:top-16 lg:min-h-0 lg:h-[calc(100svh-4rem-1.25rem)]"
                : "lg:sticky lg:top-0 lg:min-h-0 lg:h-[calc(100svh-1.25rem)]")
          )}
        >
          <ListingMapLazy listings={mappableListings} hoveredListingId={hoveredListingId} onSearchInArea={onSearchInArea} />
        </div>
      ) : null}

      {showMap ? (
        <PublicFilterButton
          aria-label={mobileViewMode === "map" ? "Show list" : "Show map"}
          aria-pressed={mobileViewMode === "map"}
          className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-30 hidden min-w-[120px] -translate-x-1/2 justify-center px-8 max-[900px]:inline-flex"
          onClick={onToggleMobileViewMode}
          size="md"
        >
          {mobileViewMode === "map" ? "List" : "Map"}
        </PublicFilterButton>
      ) : null}
    </section>
  );
}
