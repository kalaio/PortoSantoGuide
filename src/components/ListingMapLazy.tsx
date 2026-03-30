"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { MapBounds } from "@/components/ListingMap";
import type { Listing } from "@/types/listing";

type ListingMapLazyProps = {
  listings: Listing[];
  hoveredListingId: string | null;
  onSearchInArea?: (bounds: MapBounds) => void;
};

type ListingMapInternalProps = ListingMapLazyProps & {
  onReadyChange?: (isReady: boolean) => void;
};

let listingMapImportPromise: Promise<typeof import("@/components/ListingMap")> | null = null;

function loadListingMap() {
  if (!listingMapImportPromise) {
    listingMapImportPromise = import("@/components/ListingMap");
  }

  return listingMapImportPromise;
}

if (typeof window !== "undefined") {
  void loadListingMap();
}

const ListingMap = dynamic<ListingMapInternalProps>(loadListingMap, {
  ssr: false,
  loading: () => null
});

export default function ListingMapLazy(props: ListingMapLazyProps) {
  const [isMapReady, setIsMapReady] = useState(false);

  return (
    <div className="relative h-full w-full bg-white">
      <ListingMap {...props} onReadyChange={setIsMapReady} />
      {!isMapReady ? (
        <div
          className="absolute inset-0 grid place-items-center bg-white text-sm text-gray-500"
          role="status"
          aria-live="polite"
          aria-label="Loading map"
        >
          Loading map...
        </div>
      ) : null}
    </div>
  );
}
