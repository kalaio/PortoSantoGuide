"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw05 } from "@untitledui/icons";
import maplibregl from "maplibre-gl";
import PublicFilterButton from "@/components/frontend/PublicFilterButton";
import { getDetailsSummaryByFields, getFoodOpeningState, hasSchemaField } from "@/lib/listing-details";
import { renderUiIconSvg } from "@/lib/ui-icons";
import type { Listing } from "@/types/listing";
import "maplibre-gl/dist/maplibre-gl.css";

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

const buildPopupContent = (listing: Listing) => {
  const popup = document.createElement("div");
  popup.className = "listingMapPopup";

  const title = document.createElement("strong");
  title.className = "listingMapPopupTitle";
  title.textContent = listing.title;

  const category = document.createElement("p");
  category.className = "listingMapPopupMeta";
  category.textContent = listing.primaryCategory.label;

  const details = document.createElement("p");
  details.className = "listingMapPopupSummary";
  details.textContent = getDetailsSummaryByFields(listing.primaryCategory.schema?.fields, listing.details);

  popup.append(title, category, details);
  return popup;
};

const toMapBounds = (bounds: maplibregl.LngLatBounds): MapBounds => ({
  north: bounds.getNorth(),
  south: bounds.getSouth(),
  east: bounds.getEast(),
  west: bounds.getWest()
});

const DEFAULT_MARKER_ICON_NAME = "map-pin";
const INITIAL_MARKER_REFRESH_MAX_DPR = 1.5;

function shouldRunInitialMarkerRefresh() {
  return window.devicePixelRatio <= INITIAL_MARKER_REFRESH_MAX_DPR;
}

function createMapMarkerIconElement(iconName: string | null | undefined) {
  const icon = document.createElement("span");
  icon.className = "listingMapMarkerIcon";
  icon.setAttribute("aria-hidden", "true");

  icon.innerHTML = renderUiIconSvg(iconName) ?? renderUiIconSvg(DEFAULT_MARKER_ICON_NAME) ?? "";
  return icon;
}

function getMarkerOpeningState(listing: Listing): "open" | "closed" | null {
  if (!hasSchemaField(listing.primaryCategory.schema?.fields, "openingHours")) {
    return null;
  }

  return getFoodOpeningState(listing.details) ?? "closed";
}

type ListingMapProps = {
  listings: Listing[];
  hoveredListingId: string | null;
  onReadyChange?: (isReady: boolean) => void;
  onSearchInArea?: (bounds: MapBounds) => void;
};

type InitialView = {
  bounds?: MapBounds;
  center?: [number, number];
  zoom?: number;
};

type MarkerEntry = {
  element: HTMLButtonElement;
  isVisible: boolean;
  listing: MappableListing;
  marker: maplibregl.Marker;
};

type MappableListing = Listing & {
  latitude: number;
  longitude: number;
};

function hasListingCoordinates(listing: Listing): listing is MappableListing {
  return listing.latitude !== null && listing.longitude !== null;
}

function createMarkerEntry(
  map: maplibregl.Map,
  listing: MappableListing,
  isHighlighted: boolean,
  visitedListingIds: Set<string>
): MarkerEntry {
  const markerElement = document.createElement("button");
  markerElement.className = "listingMapMarker";
  markerElement.type = "button";

  const openingState = getMarkerOpeningState(listing);
  const openingLabel =
    openingState === "open" ? "open now" : openingState === "closed" ? "closed now" : null;

  markerElement.setAttribute("aria-label", openingLabel ? `${listing.title}, ${openingLabel}` : listing.title);

  if (visitedListingIds.has(listing.id)) {
    markerElement.classList.add("isVisited");
  }

  if (isHighlighted) {
    markerElement.classList.add("isHighlighted");
  }

  markerElement.append(createMapMarkerIconElement(listing.primaryCategory.iconName));

  if (openingState) {
    const markerStatusDot = document.createElement("span");
    markerStatusDot.className = `listingMapMarkerStatus ${openingState === "open" ? "isOpen" : "isClosed"}`;
    markerStatusDot.setAttribute("aria-hidden", "true");
    markerElement.append(markerStatusDot);
  }

  const popup = new maplibregl.Popup({ closeButton: false, offset: 12, maxWidth: "none" }).setDOMContent(
    buildPopupContent(listing)
  );

  const marker = new maplibregl.Marker({ element: markerElement, anchor: "center" })
    .setLngLat([listing.longitude, listing.latitude])
    .setPopup(popup);

  popup.on("open", () => {
    visitedListingIds.add(listing.id);
    markerElement.classList.add("isVisited");
    markerElement.classList.add("isHighlighted");
  });

  popup.on("close", () => {
    markerElement.classList.remove("isHighlighted");
  });

  marker.addTo(map);

  return {
    element: markerElement,
    isVisible: true,
    listing,
    marker
  };
}

function hideMarkerEntry(entry: MarkerEntry) {
  if (!entry.isVisible) {
    return;
  }

  entry.marker.getPopup()?.remove();
  entry.element.classList.remove("isHighlighted");
  entry.marker.remove();
  entry.isVisible = false;
}

function showMarkerEntry(map: maplibregl.Map, entry: MarkerEntry) {
  if (entry.isVisible) {
    return;
  }

  entry.marker.addTo(map);
  entry.isVisible = true;
}

export default function ListingMap({ listings, hoveredListingId, onReadyChange, onSearchInArea }: ListingMapProps) {
  const listingsWithCoordinates = listings.filter(hasListingCoordinates);
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, MarkerEntry>>(new Map());
  const visitedListingIdsRef = useRef<Set<string>>(new Set());
  const pendingBoundsRef = useRef<MapBounds | null>(null);
  const ignoreNextMoveRef = useRef(false);
  const ignoreMoveTimeoutRef = useRef<number | null>(null);
  const skipNextMoveEndRef = useRef(false);
  const didRunInitialMarkerRefreshRef = useRef(false);
  const onSearchInAreaRef = useRef(onSearchInArea);
  const initialListingsRef = useRef<MappableListing[] | null>(null);
  const initialViewRef = useRef<InitialView | null>(null);
  const hoveredListingIdRef = useRef<string | null>(hoveredListingId);
  const previousHoveredListingIdRef = useRef<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isSearchInAreaVisible, setIsSearchInAreaVisible] = useState(false);

  if (!initialListingsRef.current && listingsWithCoordinates.length > 0) {
    initialListingsRef.current = listingsWithCoordinates;
  }

  const styleDefinition = useMemo<maplibregl.StyleSpecification | string>(
    () =>
      process.env.NEXT_PUBLIC_MAP_STYLE_URL ??
      "https://tiles.stadiamaps.com/styles/outdoors.json",
    []
  );

  useEffect(() => {
    onSearchInAreaRef.current = onSearchInArea;
  }, [onSearchInArea]);

  useEffect(() => {
    hoveredListingIdRef.current = hoveredListingId;
  }, [hoveredListingId]);

  useEffect(() => {
    const markers = markersRef.current;
    if (!mapNodeRef.current || mapRef.current) {
      return;
    }

    onReadyChange?.(false);

    const initialListings = initialListingsRef.current ?? [];
    let mapOptions: maplibregl.MapOptions;

    const didUseInitialBounds = initialListings.length > 1;

    if (didUseInitialBounds) {
      const first = initialListings[0];
      const bounds = new maplibregl.LngLatBounds(
        [first.longitude, first.latitude],
        [first.longitude, first.latitude]
      );

      initialListings.slice(1).forEach((listing) => {
        bounds.extend([listing.longitude, listing.latitude]);
      });

      mapOptions = {
        container: mapNodeRef.current,
        style: styleDefinition,
        bounds,
        fitBoundsOptions: {
          padding: 64,
          maxZoom: 12
        }
      };
      if (!initialViewRef.current) {
        initialViewRef.current = { bounds: toMapBounds(bounds) };
      }
    } else {
      const listing = initialListings[0];
      mapOptions = {
        container: mapNodeRef.current,
        style: styleDefinition,
        center: listing ? [listing.longitude, listing.latitude] : [-8.2, 39.5],
        zoom: listing ? 12 : 5.6
      };
      if (!initialViewRef.current) {
        initialViewRef.current = {
          center: listing ? [listing.longitude, listing.latitude] : [-8.2, 39.5],
          zoom: listing ? 12 : 5.6
        };
      }
    }

    const map = new maplibregl.Map(mapOptions);
    setIsMapReady(false);

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    const onMapReady = () => {
      setIsMapReady(true);
      onReadyChange?.(true);
      if (!didRunInitialMarkerRefreshRef.current && shouldRunInitialMarkerRefresh()) {
        didRunInitialMarkerRefreshRef.current = true;
        markersRef.current.forEach((entry) => {
          entry.marker.setLngLat(entry.marker.getLngLat());
        });
      }

      if (ignoreMoveTimeoutRef.current) {
        window.clearTimeout(ignoreMoveTimeoutRef.current);
        ignoreMoveTimeoutRef.current = null;
      }

      ignoreNextMoveRef.current = didUseInitialBounds;
      if (didUseInitialBounds) {
        ignoreMoveTimeoutRef.current = window.setTimeout(() => {
          ignoreNextMoveRef.current = false;
          ignoreMoveTimeoutRef.current = null;
        }, 200);
      }
      if (onSearchInAreaRef.current) {
        pendingBoundsRef.current = toMapBounds(map.getBounds());
        setIsSearchInAreaVisible(false);
      }
    };

    const onMoveEnd = () => {
      if (!onSearchInAreaRef.current) {
        return;
      }

      if (skipNextMoveEndRef.current) {
        skipNextMoveEndRef.current = false;
        return;
      }

      if (ignoreNextMoveRef.current) {
        ignoreNextMoveRef.current = false;
        return;
      }

      pendingBoundsRef.current = toMapBounds(map.getBounds());
      setIsSearchInAreaVisible(true);
    };

    map.once("load", onMapReady);
    map.on("moveend", onMoveEnd);

    mapRef.current = map;

    return () => {
      map.off("load", onMapReady);
      map.off("moveend", onMoveEnd);
      if (ignoreMoveTimeoutRef.current) {
        window.clearTimeout(ignoreMoveTimeoutRef.current);
        ignoreMoveTimeoutRef.current = null;
      }
      map.remove();
      mapRef.current = null;
      markers.forEach((entry) => entry.marker.remove());
      markers.clear();
      didRunInitialMarkerRefreshRef.current = false;
      previousHoveredListingIdRef.current = null;
      setIsMapReady(false);
      onReadyChange?.(false);
      setIsSearchInAreaVisible(false);
    };
  }, [onReadyChange, styleDefinition]);

  useEffect(() => {
    const handleReset = () => {
      const map = mapRef.current;
      const view = initialViewRef.current;
      if (!map || !view) {
        return;
      }

      if (ignoreMoveTimeoutRef.current) {
        window.clearTimeout(ignoreMoveTimeoutRef.current);
        ignoreMoveTimeoutRef.current = null;
      }

      ignoreNextMoveRef.current = true;
      skipNextMoveEndRef.current = true;
      ignoreMoveTimeoutRef.current = window.setTimeout(() => {
        ignoreNextMoveRef.current = false;
        ignoreMoveTimeoutRef.current = null;
      }, 200);

      setIsSearchInAreaVisible(false);

      if (view.bounds) {
        const bounds = new maplibregl.LngLatBounds(
          [view.bounds.west, view.bounds.south],
          [view.bounds.east, view.bounds.north]
        );
        map.fitBounds(bounds, { padding: 64, maxZoom: 12, duration: 600 });
        pendingBoundsRef.current = view.bounds;
        return;
      }

      if (view.center && typeof view.zoom === "number") {
        map.easeTo({ center: view.center, zoom: view.zoom, duration: 600 });
        pendingBoundsRef.current = toMapBounds(map.getBounds());
      }
    };

    window.addEventListener("porto-santo-guide:reset", handleReset);
    return () => window.removeEventListener("porto-santo-guide:reset", handleReset);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) {
      return;
    }

    const markers = markersRef.current;
    const nextListingIds = new Set(listingsWithCoordinates.map((listing) => listing.id));

    markers.forEach((entry, listingId) => {
      if (!nextListingIds.has(listingId)) {
        hideMarkerEntry(entry);
      }
    });

    listingsWithCoordinates.forEach((listing) => {
      const existingEntry = markers.get(listing.id);

      if (existingEntry?.listing === listing) {
        showMarkerEntry(map, existingEntry);
        return;
      }

      if (existingEntry) {
        hideMarkerEntry(existingEntry);
        existingEntry.marker.remove();
      }

      const nextEntry = createMarkerEntry(
        map,
        listing,
        hoveredListingIdRef.current === listing.id,
        visitedListingIdsRef.current
      );

      markers.set(listing.id, nextEntry);
    });

    if (hoveredListingIdRef.current) {
      markers.get(hoveredListingIdRef.current)?.element.classList.add("isHighlighted");
    }

    const previousHoveredListingId = previousHoveredListingIdRef.current;
    if (previousHoveredListingId && !markers.has(previousHoveredListingId)) {
      previousHoveredListingIdRef.current = hoveredListingIdRef.current;
    }
  }, [isMapReady, listingsWithCoordinates]);

  useEffect(() => {
    const previousHoveredListingId = previousHoveredListingIdRef.current;

    if (previousHoveredListingId && previousHoveredListingId !== hoveredListingId) {
      markersRef.current.get(previousHoveredListingId)?.element.classList.remove("isHighlighted");
    }

    if (hoveredListingId) {
      markersRef.current.get(hoveredListingId)?.element.classList.add("isHighlighted");
    }

    previousHoveredListingIdRef.current = hoveredListingId;
  }, [hoveredListingId]);

  return (
    <div className="relative h-full w-full bg-white">
      <div ref={mapNodeRef} className={`h-full w-full transition-opacity duration-200 ${isMapReady ? "opacity-100" : "opacity-0"}`} />
      {isMapReady && isSearchInAreaVisible && onSearchInArea ? (
        <PublicFilterButton
          className="absolute left-1/2 top-5 z-10 -translate-x-1/2"
          iconLeading={RefreshCw05}
          onClick={() => {
            if (!pendingBoundsRef.current || !onSearchInArea) {
              return;
            }
            setIsSearchInAreaVisible(false);
            onSearchInArea(pendingBoundsRef.current);
          }}
          size="md"
          variant="primary"
        >
          Search in this area
        </PublicFilterButton>
      ) : null}
    </div>
  );
}
