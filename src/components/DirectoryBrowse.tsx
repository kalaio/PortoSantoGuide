"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DirectoryFiltersBar, { type DirectoryFilterOption, type DirectoryFrontendFilter } from "@/components/DirectoryFiltersBar";
import ExpandableDescription from "@/components/ExpandableDescription";
import DirectoryView from "@/components/DirectoryView";
import ListingMapLazy from "@/components/ListingMapLazy";
import PublicBreadcrumbs from "@/components/frontend/PublicBreadcrumbs";
import type { MapBounds } from "@/components/ListingMap";
import { cn } from "@/lib/cn";
import { CUISINE_OPTIONS } from "@/lib/cuisines";
import { hasListingSchemaField, isFrontendFilterEnabledListingSchemaField } from "@/lib/listing-fields";
import { getFoodCuisineValues, getFoodOpeningState, hasSchemaField } from "@/lib/listing-details";
import type { ListingSchemaFieldSummary } from "@/types/listing";
import type { Listing } from "@/types/listing";

type PriceLevelValue = "budget" | "mid" | "premium";

const PRICE_LEVEL_OPTIONS: Array<DirectoryFilterOption & { value: PriceLevelValue }> = [
  { value: "budget", label: "Budget" },
  { value: "mid", label: "Mid" },
  { value: "premium", label: "Premium" }
];

function getPriceLevelValue(listing: Listing) {
  const priceLevel = listing.details.priceLevel;

  if (priceLevel !== "budget" && priceLevel !== "mid" && priceLevel !== "premium") {
    return null;
  }

  return priceLevel;
}

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
  const [selectedPriceLevels, setSelectedPriceLevels] = useState<string[]>([]);
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
      setSelectedPriceLevels([]);
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

  const priceLevelFilterOptions = useMemo(() => {
    if (!isFrontendFilterEnabledListingSchemaField(categorySchemaFields, "priceLevel")) {
      return [];
    }

    const availablePriceLevels = new Set<PriceLevelValue>(
      listings.map((listing) => getPriceLevelValue(listing)).filter((value): value is PriceLevelValue => value !== null)
    );

    return PRICE_LEVEL_OPTIONS.filter((option) => availablePriceLevels.has(option.value));
  }, [categorySchemaFields, listings]);

  const frontendFilters = useMemo<DirectoryFrontendFilter[]>(() => {
    const filterByKey = new Map<string, DirectoryFrontendFilter>();

    if (supportsOpenNowFilter) {
      filterByKey.set("openingHours", {
        key: "openingHours",
        type: "toggle",
        label: "Open now",
        isActive: isOpenNowOnly,
        onToggle: () => setIsOpenNowOnly((currentValue) => !currentValue)
      });
    }

    if (cuisineFilterOptions.length > 0) {
      filterByKey.set("cuisines", {
        key: "cuisines",
        type: "multi-select",
        label: "Cuisine",
        options: cuisineFilterOptions,
        value: selectedCuisines,
        onChange: setSelectedCuisines
      });
    }

    if (priceLevelFilterOptions.length > 0) {
      filterByKey.set("priceLevel", {
        key: "priceLevel",
        type: "multi-select",
        label: "Price level",
        options: priceLevelFilterOptions,
        value: selectedPriceLevels,
        onChange: setSelectedPriceLevels
      });
    }

    return categorySchemaFields
      .filter((field) => field.isFrontendFilterEnabled)
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((field) => filterByKey.get(field.fieldKey) ?? null)
      .filter((filter): filter is DirectoryFrontendFilter => filter !== null);
  }, [
    categorySchemaFields,
    cuisineFilterOptions,
    isOpenNowOnly,
    priceLevelFilterOptions,
    selectedCuisines,
    selectedPriceLevels,
    supportsOpenNowFilter
  ]);

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

        const listingPriceLevel = getPriceLevelValue(listing);
        const matchesPriceLevel =
          selectedPriceLevels.length === 0 || (listingPriceLevel !== null && selectedPriceLevels.includes(listingPriceLevel));

        return isInsideArea && isOpenNow && matchesCuisine && matchesPriceLevel;
      }),
    [areaBounds, isOpenNowOnly, listings, selectedCuisines, selectedPriceLevels]
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
  const hasVisibleFilters = hasArchiveListings && frontendFilters.length > 0;

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

  const shouldRenderDesktopMap = showMap && !isMobileViewport;

  return (
    <>
      {hasVisibleFilters ? (
        <DirectoryFiltersBar
          filters={frontendFilters}
          isMobileMapMode={isMobileMapMode}
          onBackToList={() => setMobileViewMode("list")}
        />
      ) : null}

      <div
        className={cn(
          "mx-auto w-full max-w-[1280px] px-4 md:px-5",
          shouldRenderDesktopMap && "grid gap-5 [grid-template-columns:minmax(0,1fr)_minmax(21rem,38rem)] max-[900px]:block"
        )}
      >
        <main className={cn("min-w-0 pt-4 pb-6 md:pt-6 md:pb-10", !shouldRenderDesktopMap && "mx-auto w-full") }>
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

        {shouldRenderDesktopMap ? (
          <aside className="min-w-0 max-[900px]:hidden">
            <div
              className={cn(
                "overflow-hidden bg-white",
                hasVisibleFilters ? "sticky top-16 h-[calc(100svh-4rem)]" : "sticky top-0 h-screen"
              )}
            >
              <ListingMapLazy listings={mappableListings} hoveredListingId={hoveredListingId} onSearchInArea={handleSearchInArea} />
            </div>
          </aside>
        ) : null}
      </div>
    </>
  );
}
