"use client";

import dynamic from "next/dynamic";
import type { MapBounds } from "@/components/ListingMap";
import type { Listing } from "@/types/listing";

type ListingMapLazyProps = {
  listings: Listing[];
  hoveredListingId: string | null;
  onSearchInArea?: (bounds: MapBounds) => void;
};

let listingMapImportPromise: Promise<typeof import("@/components/ListingMap")> | null = null;

function loadListingMap() {
  if (!listingMapImportPromise) {
    listingMapImportPromise = import("@/components/ListingMap");
  }

  return listingMapImportPromise;
}

function MapLoadingFallback() {
  return (
    <div className="relative h-full w-full bg-white">
      <div
        className="absolute inset-0 grid place-items-center bg-white text-sm text-gray-500"
        role="status"
        aria-live="polite"
        aria-label="Loading map"
      >
        Loading map...
      </div>
    </div>
  );
}

if (typeof window !== "undefined") {
  void loadListingMap();
}

const ListingMap = dynamic<ListingMapLazyProps>(loadListingMap, {
  ssr: false,
  loading: MapLoadingFallback
});

export default function ListingMapLazy(props: ListingMapLazyProps) {
  return <ListingMap {...props} />;
}
