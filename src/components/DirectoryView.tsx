"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MultiCheckboxFilterPopover from "@/app/(frontend)/components/MultiCheckboxFilterPopover";
import PublicFilterButton from "@/components/frontend/PublicFilterButton";
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
            "flex items-center justify-between gap-3 border-y border-black/10 bg-white px-2 py-3",
            isMobileMapMode
              ? "fixed inset-x-0 top-16 z-30 h-[60px] py-0 justify-start flex-nowrap scrollbar-hide"
              : "sticky z-30 top-20 max-[900px]:top-16"
          )}
          aria-label="Archive filters"
          role="region"
        >
          <div className={cn(
            "flex flex-wrap items-center gap-3",
            isMobileMapMode ? "flex-nowrap overflow-x-auto whitespace-nowrap" : "max-[900px]:overflow-x-auto max-[900px]:whitespace-nowrap"
          )}>
            {supportsOpenNowFilter ? (
              <PublicFilterButton
                aria-pressed={isOpenNowOnly}
                className="shrink-0"
                isActive={isOpenNowOnly}
                onClick={() => setIsOpenNowOnly((currentValue) => !currentValue)}
                size="md"
              >
                Open now
              </PublicFilterButton>
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
                      "rounded-[1.5rem] border bg-white px-5 py-4 transition",
                      isActive
                        ? "border-[var(--psg-brand)]"
                        : "border-black/10 hover:border-[color:rgb(7_109_112_/_0.28)]"
                    )}
                    onMouseEnter={() => setHoveredListingId(listing.id)}
                    onMouseLeave={() => setHoveredListingId(null)}
                  >
                    <h3 className="m-0 text-lg font-semibold text-black">{listing.title}</h3>
                    <p className="mt-1 text-md text-[color:var(--psg-text-secondary)]">{listing.categories.map((item) => item.label).join(" · ")}</p>
                    {detailsSummary ? <p className="mt-1 text-md text-[color:var(--psg-text-secondary)]">{detailsSummary}</p> : null}
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
              "min-h-[44rem] overflow-hidden rounded-[1.75rem] border border-black/10 bg-white",
              isMobileMapMode
                ? "max-[900px]:fixed max-[900px]:inset-x-0 max-[900px]:bottom-0 max-[900px]:top-[7.6rem] max-[900px]:z-20 max-[900px]:block max-[900px]:min-h-[50vh] max-[900px]:rounded-none max-[900px]:border-x-0 max-[900px]:border-b-0"
                : "max-[900px]:hidden",
              isMobileMapMode && !hasVisibleFilters && "max-[900px]:top-16"
            )}
          >
            <ListingMapLazy
              listings={mappableListings}
              hoveredListingId={hoveredListingId}
              onSearchInArea={handleSearchInArea}
            />
          </div>
        ) : null}

        {showMap ? (
          <PublicFilterButton
            aria-pressed={mobileViewMode === "map"}
            aria-label={mobileViewMode === "map" ? "Show list" : "Show map"}
            className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-30 hidden min-w-[120px] -translate-x-1/2 justify-center px-8 max-[900px]:inline-flex"
            onClick={() => {
              setMobileViewMode((currentMode) => (currentMode === "list" ? "map" : "list"));
            }}
            size="md"
          >
            {mobileViewMode === "map" ? "List" : "Map"}
          </PublicFilterButton>
        ) : null}
      </section>
    </div>
  );
}
