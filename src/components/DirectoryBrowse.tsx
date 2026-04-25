"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DirectoryFiltersBar, { type DirectoryFilterOption, type DirectoryFrontendFilter } from "@/components/DirectoryFiltersBar";
import DirectoryView from "@/components/DirectoryView";
import ListingMapLazy from "@/components/ListingMapLazy";
import PublicBreadcrumbs from "@/components/frontend/PublicBreadcrumbs";
import type { ListingMapHandle, MapBounds } from "@/components/ListingMap";
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
  listings: Listing[];
  title: string;
};

export default function DirectoryBrowse({ breadcrumbs, categorySchemaFields, listings, title }: DirectoryBrowseProps) {
  const [areaBounds, setAreaBounds] = useState<MapBounds | null>(null);
  const [isOpenNowOnly, setIsOpenNowOnly] = useState(false);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedPriceLevels, setSelectedPriceLevels] = useState<string[]>([]);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobileViewMode, setMobileViewMode] = useState<"list" | "map">("list");
  const [desktopWorkspaceHeight, setDesktopWorkspaceHeight] = useState<number | null>(null);
  const listingMapHandleRef = useRef<ListingMapHandle | null>(null);
  const desktopWorkspaceRef = useRef<HTMLDivElement | null>(null);
  const hasArchiveListings = listings.length > 0;
  const hasLocationField = useMemo(() => hasListingSchemaField(categorySchemaFields, "location"), [categorySchemaFields]);

  const supportsOpenNowFilter = useMemo(
    () => hasArchiveListings && isFrontendFilterEnabledListingSchemaField(categorySchemaFields, "openingHours"),
    [categorySchemaFields, hasArchiveListings]
  );

  const resetFiltersAndArea = useCallback(() => {
    setAreaBounds(null);
    listingMapHandleRef.current?.setExternalHoveredListingId(null);
    setIsOpenNowOnly(false);
    setSelectedCuisines([]);
    setSelectedPriceLevels([]);
  }, []);

  useEffect(() => {
    const handleReset = () => {
      resetFiltersAndArea();
      setMobileViewMode("list");
    };

    window.addEventListener("porto-santo-guide:reset", handleReset);
    return () => window.removeEventListener("porto-santo-guide:reset", handleReset);
  }, [resetFiltersAndArea]);

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

  const handleSearchInArea = useCallback((bounds: MapBounds) => {
    setAreaBounds(bounds);
    listingMapHandleRef.current?.setExternalHoveredListingId(null);
  }, []);

  const handleListingHoverChange = useCallback((listingId: string | null) => {
    listingMapHandleRef.current?.setExternalHoveredListingId(listingId);
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

  const listingFilterMetadata = useMemo(
    () =>
      listings.map((listing) => ({
        cuisineValues: hasSchemaField(listing.primaryCategory.schema?.fields, "cuisines") ? getFoodCuisineValues(listing.details) : [],
        listing,
        openingState: hasSchemaField(listing.primaryCategory.schema?.fields, "openingHours") ? getFoodOpeningState(listing.details) : null,
        priceLevel: getPriceLevelValue(listing)
      })),
    [listings]
  );

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
      listingFilterMetadata
        .filter(({ cuisineValues, listing, openingState, priceLevel }) => {
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
          !isOpenNowOnly || openingState === "open";

        const matchesCuisine =
          selectedCuisines.length === 0 || selectedCuisines.some((selectedCuisine) => cuisineValues.includes(selectedCuisine));

        const matchesPriceLevel =
          selectedPriceLevels.length === 0 || (priceLevel !== null && selectedPriceLevels.includes(priceLevel));

        return isInsideArea && isOpenNow && matchesCuisine && matchesPriceLevel;
      })
        .map(({ listing }) => listing),
    [areaBounds, isOpenNowOnly, listingFilterMetadata, selectedCuisines, selectedPriceLevels]
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
  const hasActiveFilters = areaBounds !== null || isOpenNowOnly || selectedCuisines.length > 0 || selectedPriceLevels.length > 0;

  const handleClearFilters = useCallback(() => {
    resetFiltersAndArea();
    window.dispatchEvent(new Event("porto-santo-guide:reset-map"));
  }, [resetFiltersAndArea]);

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

  useEffect(() => {
    document.documentElement.classList.toggle("desktopDirectoryWorkspaceMode", shouldRenderDesktopMap);
    document.body.classList.toggle("desktopDirectoryWorkspaceMode", shouldRenderDesktopMap);

    return () => {
      document.documentElement.classList.remove("desktopDirectoryWorkspaceMode");
      document.body.classList.remove("desktopDirectoryWorkspaceMode");
    };
  }, [shouldRenderDesktopMap]);

  useEffect(() => {
    if (!shouldRenderDesktopMap) {
      setDesktopWorkspaceHeight(null);
      return;
    }

    const syncDesktopWorkspaceHeight = () => {
      if (!desktopWorkspaceRef.current) {
        return;
      }

      const { top } = desktopWorkspaceRef.current.getBoundingClientRect();
      const nextHeight = Math.max(320, Math.floor(window.innerHeight - top));

      setDesktopWorkspaceHeight((currentValue) => (currentValue === nextHeight ? currentValue : nextHeight));
    };

    const frameId = window.requestAnimationFrame(syncDesktopWorkspaceHeight);
    window.addEventListener("resize", syncDesktopWorkspaceHeight);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", syncDesktopWorkspaceHeight);
    };
  }, [hasVisibleFilters, shouldRenderDesktopMap]);

  return (
    <>
      <div className="w-full border-b border-black/10 bg-white">
        <section className="mx-auto grid w-full max-w-[1280px] gap-1.5 px-4 py-3 md:px-5 md:py-4 max-[640px]:py-3">
          <PublicBreadcrumbs className="gap-1 text-xs [&_svg]:h-3 [&_svg]:w-3" items={breadcrumbs} />
          <h1 className="m-0 text-display-sm font-semibold tracking-[-0.04em] text-black">{title}</h1>
        </section>
      </div>

      {hasVisibleFilters ? (
        <DirectoryFiltersBar
          filters={frontendFilters}
          hasActiveFilters={hasActiveFilters}
          isMobileMapMode={isMobileMapMode}
          onBackToList={() => setMobileViewMode("list")}
          onClearFilters={handleClearFilters}
        />
      ) : null}

      <div
        ref={desktopWorkspaceRef}
        className={cn(
          "mx-auto w-full max-w-[1280px] px-4 md:px-5",
          shouldRenderDesktopMap && "grid min-h-0 gap-0 overflow-hidden [grid-template-columns:minmax(0,3fr)_minmax(0,2fr)] max-[900px]:block"
        )}
        style={shouldRenderDesktopMap && desktopWorkspaceHeight !== null ? { height: `${desktopWorkspaceHeight}px` } : undefined}
      >
        <main
          className={cn(
            "min-w-0 pt-4 pb-6 md:pt-5 md:pb-8",
            shouldRenderDesktopMap ? "min-h-0 overflow-y-auto md:pr-4 lg:pr-5" : "mx-auto w-full"
          )}
        >
          <DirectoryView
            hasVisibleFilters={hasVisibleFilters}
            isMobileViewport={isMobileViewport}
            mapHandleRef={listingMapHandleRef}
            mappableListings={mappableListings}
            mobileViewMode={mobileViewMode}
            onHoverListingChange={handleListingHoverChange}
            onSearchInArea={handleSearchInArea}
            onToggleMobileViewMode={() => {
              setMobileViewMode((currentMode) => (currentMode === "list" ? "map" : "list"));
            }}
            showMap={showMap}
            visibleListings={visibleListings}
          />
        </main>

        {shouldRenderDesktopMap ? (
          <aside className="min-w-0 h-full max-[900px]:hidden">
            <div className="h-full overflow-hidden bg-white">
              <ListingMapLazy isVisible listings={mappableListings} mapHandleRef={listingMapHandleRef} onSearchInArea={handleSearchInArea} />
            </div>
          </aside>
        ) : null}
      </div>
    </>
  );
}
