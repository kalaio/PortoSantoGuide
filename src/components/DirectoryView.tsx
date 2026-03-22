"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MultiCheckboxFilterPopover from "@/components/filters/MultiCheckboxFilterPopover";
import type { MapBounds } from "@/components/ListingMap";
import ListingMapLazy from "@/components/ListingMapLazy";
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
    <div className={`directoryArchive${isMobileMapMode ? " isMobileMapMode" : ""}${hasVisibleFilters ? " hasFilters" : " hasNoFilters"}`}>
      {hasVisibleFilters ? (
        <div className="directoryFiltersBar" aria-label="Archive filters" role="region">
          <div className="directoryFiltersLeft">
            {supportsOpenNowFilter ? (
              <button
                className={`filterButton${isOpenNowOnly ? " isActive" : ""}`}
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
        className={`directoryLayoutGrid${isMobileMapMode ? " isMobileMapMode" : ""}${showMap ? "" : " hasNoMap"}`}
      >
        <aside className="directoryPanel">
          <div className="directoryListingList">
            {visibleListings.map((listing) => {
              const isActive = hoveredListingId === listing.id;
              const detailsSummary = getDetailsSummaryByFields(listing.primaryCategory.schema?.fields, listing.details);

              return (
                <Link
                  key={listing.id}
                  href={getListingPath(listing)}
                  className="listingCardLink"
                  onFocus={() => setHoveredListingId(listing.id)}
                  onBlur={() => setHoveredListingId(null)}
                >
                  <article
                    className={`directoryListingItem${isActive ? " isActive" : ""}`}
                    onMouseEnter={() => setHoveredListingId(listing.id)}
                    onMouseLeave={() => setHoveredListingId(null)}
                    >
                      <h3>{listing.title}</h3>
                      <p className="muted">{listing.categories.map((item) => item.label).join(" · ")}</p>
                      {detailsSummary ? <p className="muted">{detailsSummary}</p> : null}
                    </article>
                  </Link>
              );
            })}
            {visibleListings.length === 0 ? <p className="muted">No places in this area.</p> : null}
          </div>
        </aside>

        {showMap ? (
          <div className="mapWrap directoryMapWrap">
            <ListingMapLazy
              listings={mappableListings}
              hoveredListingId={hoveredListingId}
              onSearchInArea={handleSearchInArea}
            />
          </div>
        ) : null}

        {showMap ? (
          <button
            className="directoryMobileToggle"
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
