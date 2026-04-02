"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DirectoryFiltersBar from "@/components/DirectoryFiltersBar";
import ExpandableDescription from "@/components/ExpandableDescription";
import DirectoryView from "@/components/DirectoryView";
import PublicBreadcrumbs from "@/components/frontend/PublicBreadcrumbs";
import type { MapBounds } from "@/components/ListingMap";
import { CUISINE_OPTIONS } from "@/lib/cuisines";
import { hasListingSchemaField, isFrontendFilterEnabledListingSchemaField } from "@/lib/listing-fields";
import { getFoodCuisineValues, getFoodOpeningState, hasSchemaField } from "@/lib/listing-details";
import type { ListingSchemaFieldSummary } from "@/types/listing";
import type { Listing } from "@/types/listing";

type DirectoryBrowseBreadcrumbItem = {
  href?: string;
  label: string;
};

type DirectoryBrowseProps = {
  breadcrumbs: DirectoryBrowseBreadcrumbItem[];
  categorySchemaFields: ListingSchemaFieldSummary[];
  description: string;
  listings: Listing[];
  title: string;
};

export default function DirectoryBrowse({ breadcrumbs, categorySchemaFields, description, listings, title }: DirectoryBrowseProps) {
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);
  const [areaBounds, setAreaBounds] = useState<MapBounds | null>(null);
  const [isOpenNowOnly, setIsOpenNowOnly] = useState(false);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobileViewMode, setMobileViewMode] = useState<"list" | "map">("list");
  const hasArchiveListings = listings.length > 0;
  const hasLocationField = useMemo(() => hasListingSchemaField(categorySchemaFields, "location"), [categorySchemaFields]);

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

    const availableCuisineValues = new Set(listings.flatMap((listing) => getFoodCuisineValues(listing.details)));

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
          selectedCuisines.length === 0 || selectedCuisines.some((selectedCuisine) => listingCuisineValues.includes(selectedCuisine));

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

  useEffect(() => {
    document.body.classList.toggle("mobileMapMode", isMobileMapMode);

    return () => {
      document.body.classList.remove("mobileMapMode");
    };
  }, [isMobileMapMode]);

  return (
    <>
      {hasVisibleFilters ? (
        <DirectoryFiltersBar
          cuisineFilterOptions={cuisineFilterOptions}
          isMobileMapMode={isMobileMapMode}
          isOpenNowOnly={isOpenNowOnly}
          onBackToList={() => setMobileViewMode("list")}
          onToggleOpenNowOnly={() => setIsOpenNowOnly((currentValue) => !currentValue)}
          selectedCuisines={selectedCuisines}
          setSelectedCuisines={setSelectedCuisines}
          supportsOpenNowFilter={supportsOpenNowFilter}
        />
      ) : null}

      <main className="mx-auto w-full max-w-[1280px] px-4 pt-4 pb-6 md:px-5 md:pt-6 md:pb-10">
        <section className="mb-8 grid gap-3 max-[640px]:mb-6">
          <PublicBreadcrumbs items={breadcrumbs} />
          <h1 className="m-0 text-display-sm font-semibold tracking-[-0.04em] text-black">{title}</h1>
          <ExpandableDescription className="max-w-[46rem]" text={description} />
        </section>

        <DirectoryView
          hasVisibleFilters={hasVisibleFilters}
          hoveredListingId={hoveredListingId}
          isMobileViewport={isMobileViewport}
          mappableListings={mappableListings}
          mobileViewMode={mobileViewMode}
          onHoverListingChange={setHoveredListingId}
          onSearchInArea={handleSearchInArea}
          onToggleMobileViewMode={() => {
            setMobileViewMode((currentMode) => (currentMode === "list" ? "map" : "list"));
          }}
          showMap={showMap}
          visibleListings={visibleListings}
        />
      </main>
    </>
  );
}
