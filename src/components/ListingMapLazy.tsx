"use client";

import { useState, type Ref } from "react";
import dynamic from "next/dynamic";
import type { ListingMapHandle, MapBounds } from "@/components/ListingMap";
import type { Listing } from "@/types/listing";

type ListingMapLazyProps = {
  listings: Listing[];
  allowScrollWheelZoom?: boolean;
  isVisible?: boolean;
  mapHandleRef?: Ref<ListingMapHandle>;
  mobileCardMode?: boolean;
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

const ListingMap = dynamic<ListingMapInternalProps>(loadListingMap, {
  ssr: false,
  loading: () => null
});

export default function ListingMapLazy(props: ListingMapLazyProps) {
  const [isMapReady, setIsMapReady] = useState(false);

  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      <ListingMap {...props} onReadyChange={setIsMapReady} />
      {!isMapReady ? (
        <div
          className="pointer-events-none absolute inset-0 grid place-items-center bg-white/78 text-sm text-gray-500"
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
