"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MultiCheckboxFilterPopover from "@/app/(frontend)/components/MultiCheckboxFilterPopover";
import type { MapBounds } from "@/components/ListingMap";
import ListingMapLazy from "@/components/ListingMapLazy";
import { cn } from "@/lib/cn";
import { CUISINE_OPTIONS } from "@/lib/cuisines";
import { hasListingSchemaField, isFrontendFilterEnabledListingSchemaField } from "@/lib/listing-fields";
import { getDetailsSummaryByFields, getFoodCuisineValues, getFoodOpeningState, hasSchemaField } from "@/lib/listing-details";
import { getListingPath } from "@/lib/listing-path";
import type { ListingSchemaFieldSummary } from "@/types/listing";
import type { Listing } from "@/types/listing";

type DirectoryViewProps = {
  listings: Listing[];
  categorySchemaFields: ListingSchemaFieldSummary[];
};

export default function DirectoryView({ listings, categorySchemaFields }: DirectoryViewProps) {
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);
  const [areaBounds, setAreaBounds] = useState<MapBounds | null>(null);
  const [isOpenNowOnly, setIsOpenNowOnly] = useState(false);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobileViewMode, setMobileViewMode] = useState<"list" | "map">("list");
  const hasArchiveListings = listings.length > 0;
  const hasLocationField = useMemo(
    () => hasListingSchemaField(categorySchemaFields, "location"),
    [categorySchemaFields]
  );

  const supportsOpenNowFilter = useMemo(
    () => hasArchiveListings && isFrontendFilterEnabledListingSchemaField(categorySchemaFields, "openingHours"),
    [categorySchemaFields, hasArchiveListings]
  );

  useEffect(() => {
    const handleReset = () => {
      setAreaBounds(null);
      setHoveredListingId(null);
      setIsOpenNowOnly(false);
      setSelectedCuisines([]);
      setMobileViewMode("list");
    };

    window.addEventListener("porto-santo-guide:reset", handleReset);
    return () => window.removeEventListener("porto-santo-guide:reset", handleReset);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 900px)");

    const syncViewport = () => {
      setIsMobileViewport(mediaQuery.matches);
      if (!mediaQuery.matches) {
        setMobileViewMode("list");
      }
    };

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => {
      mediaQuery.removeEventListener("change", syncViewport);
    };
  }, []);

  useEffect(() => {
    if (!isMobileViewport || mobileViewMode !== "map") {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isMobileViewport, mobileViewMode]);

  const handleSearchInArea = useCallback((bounds: MapBounds) => {
    setAreaBounds(bounds);
    setHoveredListingId(null);
  }, []);

  const cuisineFilterOptions = useMemo(() => {
    if (!isFrontendFilterEnabledListingSchemaField(categorySchemaFields, "cuisines")) {
      return [];
    }

    const availableCuisineValues = new Set(
      listings.flatMap((listing) => getFoodCuisineValues(listing.details))
    );

    return CUISINE_OPTIONS.filter((option) => availableCuisineValues.has(option.value));
  }, [categorySchemaFields, listings]);

  const visibleListings = useMemo(
    () =>
      listings.filter((listing) => {
        const isInsideArea =
          !areaBounds ||
          listing.latitude === null ||
          listing.longitude === null ||
          !(
            listing.latitude > areaBounds.north ||
            listing.latitude < areaBounds.south ||
            listing.longitude > areaBounds.east ||
            listing.longitude < areaBounds.west
          );

        const isOpenNow =
          !isOpenNowOnly ||
          (hasSchemaField(listing.primaryCategory.schema?.fields, "openingHours") && getFoodOpeningState(listing.details) === "open");

        const listingCuisineValues =
          hasSchemaField(listing.primaryCategory.schema?.fields, "cuisines") ? getFoodCuisineValues(listing.details) : [];
        const matchesCuisine =
          selectedCuisines.length === 0 ||
          selectedCuisines.some((selectedCuisine) => listingCuisineValues.includes(selectedCuisine));

        return isInsideArea && isOpenNow && matchesCuisine;
      }),
    [areaBounds, isOpenNowOnly, listings, selectedCuisines]
  );

  const mappableListings = useMemo(
    () => visibleListings.filter((listing) => listing.latitude !== null && listing.longitude !== null),
    [visibleListings]
  );
  const hasAnyMappableListings = useMemo(
    () => listings.some((listing) => listing.latitude !== null && listing.longitude !== null),
    [listings]
  );
  const showMap = hasLocationField && hasAnyMappableListings;
  const hasVisibleFilters = hasArchiveListings && (supportsOpenNowFilter || cuisineFilterOptions.length > 0);

  useEffect(() => {
    if (!showMap) {
      setMobileViewMode("list");
    }
  }, [showMap]);

  const isMobileMapMode = showMap && isMobileViewport && mobileViewMode === "map";

  return (
    <div className="grid gap-5">
      {hasVisibleFilters ? (
        <div
          className={cn(
            "sticky z-30 flex items-center justify-between gap-3 border-y border-gray-200 bg-white/95 px-2 py-3 backdrop-blur",
            isMobileMapMode && "fixed inset-x-0 h-14 py-0 justify-start flex-nowrap scrollbar-hide",
            isMobileMapMode ? "top-16" : "top-20 max-[900px]:top-16"
          )}
          aria-label="Archive filters"
          role="region"
        >
          <div className={cn(
            "flex flex-wrap items-center gap-3",
            isMobileMapMode ? "flex-nowrap overflow-x-auto whitespace-nowrap" : "max-[900px]:overflow-x-auto max-[900px]:whitespace-nowrap"
          )}>
            {supportsOpenNowFilter ? (
              <button
                className={cn(
                  "inline-flex min-h-12 items-center rounded-full border bg-white px-5 text-[1.0625rem] font-medium text-gray-900 transition",
                  isOpenNowOnly
                    ? "border-gray-950 shadow-sm"
                    : "border-gray-200 hover:border-brand-200 hover:bg-gray-50"
                )}
                type="button"
                aria-pressed={isOpenNowOnly}
                onClick={() => setIsOpenNowOnly((currentValue) => !currentValue)}
              >
                Open now
              </button>
            ) : null}
            {cuisineFilterOptions.length > 0 ? (
              <MultiCheckboxFilterPopover
                label="Cuisine"
                options={cuisineFilterOptions}
                value={selectedCuisines}
                onChange={setSelectedCuisines}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      <section
        className={cn(
          "grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(21rem,38rem)]",
          !showMap && "grid-cols-1",
          isMobileMapMode && "block"
        )}
      >
        <aside className={cn(isMobileMapMode && "hidden") }>
          <div className="grid gap-3">
            {visibleListings.map((listing) => {
              const isActive = hoveredListingId === listing.id;
              const detailsSummary = getDetailsSummaryByFields(listing.primaryCategory.schema?.fields, listing.details);

              return (
                <Link
                  key={listing.id}
                  href={getListingPath(listing)}
                  className="block"
                  onFocus={() => setHoveredListingId(listing.id)}
                  onBlur={() => setHoveredListingId(null)}
                >
                  <article
                    className={cn(
                      "rounded-[1.5rem] border bg-white px-5 py-4 shadow-sm transition",
                      isActive
                        ? "border-brand-500 shadow-md"
                        : "border-gray-200 hover:border-brand-200 hover:shadow-md"
                    )}
                    onMouseEnter={() => setHoveredListingId(listing.id)}
                    onMouseLeave={() => setHoveredListingId(null)}
                  >
                    <h3 className="m-0 text-[1.2rem] font-semibold text-gray-950">{listing.title}</h3>
                    <p className="mt-1 text-base text-gray-500">{listing.categories.map((item) => item.label).join(" · ")}</p>
                    {detailsSummary ? <p className="mt-1 text-base leading-8 text-gray-500">{detailsSummary}</p> : null}
                  </article>
                </Link>
              );
            })}
            {visibleListings.length === 0 ? (
              <p className="rounded-[1.5rem] border border-dashed border-gray-300 bg-white px-5 py-8 text-base text-gray-500">
                No places in this area.
              </p>
            ) : null}
          </div>
        </aside>

        {showMap ? (
          <div
            className={cn(
              "min-h-[44rem] overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white shadow-sm max-[900px]:min-h-[50vh]",
              isMobileViewport && mobileViewMode === "list" && "hidden",
              isMobileMapMode && "fixed inset-x-0 bottom-0 top-[7.6rem] z-20 rounded-none border-x-0 border-b-0",
              isMobileMapMode && !hasVisibleFilters && "top-16"
            )}
          >
            <ListingMapLazy
              listings={mappableListings}
              hoveredListingId={hoveredListingId}
              onSearchInArea={handleSearchInArea}
            />
          </div>
        ) : null}

        {showMap && isMobileViewport ? (
          <button
            className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-30 inline-flex min-h-12 min-w-[120px] -translate-x-1/2 items-center justify-center rounded-full border border-gray-200 bg-white px-8 text-[1.3rem] font-semibold text-brand-900 shadow-[0_20px_40px_rgba(10,13,18,0.12)] cursor-pointer"
            type="button"
            aria-pressed={mobileViewMode === "map"}
            aria-label={mobileViewMode === "map" ? "Show list" : "Show map"}
            onClick={() => {
              setMobileViewMode((currentMode) => (currentMode === "list" ? "map" : "list"));
            }}
          >
            {mobileViewMode === "map" ? "List" : "Map"}
          </button>
        ) : null}
      </section>
    </div>
  );
}
