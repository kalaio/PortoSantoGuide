"use client";

import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from "react";
import { RefreshCw05 } from "@untitledui/icons";
import PublicFilterButton from "@/components/frontend/PublicFilterButton";
import { createGoogleMarkerIcon, createGoogleMarkerIconAsync, hasGoogleMapsApiKey, loadGoogleMapsApi } from "@/lib/google-maps";
import { getDetailsSummaryByFields, getFoodOpeningState, hasSchemaField } from "@/lib/listing-details";
import { normalizeUiIconName, type UiIconId } from "@/lib/ui-icons";
import type { Listing } from "@/types/listing";

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type ListingMapHandle = {
  setExternalHoveredListingId: (listingId: string | null) => void;
};

type MarkerPopupData = {
  categoryLabel: string;
  summary: string;
  title: string;
};

type ListingMapProps = {
  isVisible?: boolean;
  listings: Listing[];
  mapHandleRef?: Ref<ListingMapHandle>;
  mobileCardMode?: boolean;
  onReadyChange?: (isReady: boolean) => void;
  onSearchInArea?: (bounds: MapBounds) => void;
};

type InitialView = {
  bounds?: MapBounds;
  center?: google.maps.LatLngLiteral;
  zoom?: number;
};

type MappableListing = Listing & {
  latitude: number;
  longitude: number;
};

type MarkerDescriptor = {
  iconId: UiIconId;
  listing: MappableListing;
  openingState: "open" | "closed" | null;
  popupData: MarkerPopupData;
};

const DEFAULT_MAP_CENTER: google.maps.LatLngLiteral = { lat: 39.5, lng: -8.2 };
const DEFAULT_MAP_ZOOM = 5.6;
const LISTING_MAP_ZOOM = 12;
const FIT_BOUNDS_PADDING = 64;
const IGNORE_IDLE_WINDOW_MS = 200;
const DEFAULT_MARKER_ICON_ID: UiIconId = "map-pin";

const buildPopupContent = ({ categoryLabel, summary, title }: MarkerPopupData) => {
  const popup = document.createElement("div");
  popup.className = "listingMapPopup";

  const titleElement = document.createElement("strong");
  titleElement.className = "listingMapPopupTitle";
  titleElement.textContent = title;

  const categoryElement = document.createElement("p");
  categoryElement.className = "listingMapPopupMeta";
  categoryElement.textContent = categoryLabel;

  popup.append(titleElement, categoryElement);

  if (summary) {
    const summaryElement = document.createElement("p");
    summaryElement.className = "listingMapPopupSummary";
    summaryElement.textContent = summary;
    popup.append(summaryElement);
  }

  return popup;
};

function toMapBounds(bounds: google.maps.LatLngBounds): MapBounds {
  const northEast = bounds.getNorthEast();
  const southWest = bounds.getSouthWest();

  return {
    north: northEast.lat(),
    south: southWest.lat(),
    east: northEast.lng(),
    west: southWest.lng()
  };
}

function toLatLngLiteral(listing: MappableListing): google.maps.LatLngLiteral {
  return { lat: listing.latitude, lng: listing.longitude };
}

function hasListingCoordinates(listing: Listing): listing is MappableListing {
  return listing.latitude !== null && listing.longitude !== null;
}

function getMarkerOpeningState(listing: Listing): "open" | "closed" | null {
  if (!hasSchemaField(listing.primaryCategory.schema?.fields, "openingHours")) {
    return null;
  }

  return getFoodOpeningState(listing.details) ?? "closed";
}

function getMarkerIconId(iconName: string | null | undefined): UiIconId {
  return normalizeUiIconName(iconName) ?? DEFAULT_MARKER_ICON_ID;
}

function buildActiveListingIds({
  externalHoveredListingId,
  mapHoveredListingId,
  popupListingId,
  selectedListingId,
}: {
  externalHoveredListingId: string | null;
  mapHoveredListingId: string | null;
  popupListingId: string | null;
  selectedListingId: string | null;
}) {
  const ids = new Set<string>();

  if (externalHoveredListingId) {
    ids.add(externalHoveredListingId);
  }

  if (mapHoveredListingId) {
    ids.add(mapHoveredListingId);
  }

  if (popupListingId) {
    ids.add(popupListingId);
  }

  if (selectedListingId) {
    ids.add(selectedListingId);
  }

  return ids;
}

function buildBoundsFromListings(listings: MappableListing[]): MapBounds | null {
  if (listings.length === 0) {
    return null;
  }

  const first = listings[0];
  let north = first.latitude;
  let south = first.latitude;
  let east = first.longitude;
  let west = first.longitude;

  for (const listing of listings.slice(1)) {
    north = Math.max(north, listing.latitude);
    south = Math.min(south, listing.latitude);
    east = Math.max(east, listing.longitude);
    west = Math.min(west, listing.longitude);
  }

  return { north, south, east, west };
}

function toBoundsLiteral(bounds: MapBounds): google.maps.LatLngBoundsLiteral {
  return {
    north: bounds.north,
    south: bounds.south,
    east: bounds.east,
    west: bounds.west
  };
}

export default function ListingMap({
  isVisible = true,
  listings,
  mapHandleRef,
  mobileCardMode = false,
  onReadyChange,
  onSearchInArea,
}: ListingMapProps) {
  const listingsWithCoordinates = useMemo(() => listings.filter(hasListingCoordinates), [listings]);
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const pendingBoundsRef = useRef<MapBounds | null>(null);
  const ignoreNextIdleRef = useRef(false);
  const ignoreIdleTimeoutRef = useRef<number | null>(null);
  const mapReadyRef = useRef(false);
  const onReadyChangeRef = useRef(onReadyChange);
  const onSearchInAreaRef = useRef(onSearchInArea);
  const initialListingsRef = useRef<MappableListing[] | null>(null);
  const initialViewRef = useRef<InitialView | null>(null);
  const markerDescriptorsByIdRef = useRef<Map<string, MarkerDescriptor>>(new Map());
  const mobileCardModeRef = useRef(mobileCardMode);
  const visitedListingIdsRef = useRef<Set<string>>(new Set());
  const [externalHoveredListingId, setExternalHoveredListingId] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isSearchInAreaVisible, setIsSearchInAreaVisible] = useState(false);
  const [mapHoveredListingId, setMapHoveredListingId] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [popupListingId, setPopupListingId] = useState<string | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [visitedListingIdsState, setVisitedListingIdsState] = useState<string[]>([]);

  if (!initialListingsRef.current && listingsWithCoordinates.length > 0) {
    initialListingsRef.current = listingsWithCoordinates;
  }

  useEffect(() => {
    onReadyChangeRef.current = onReadyChange;
  }, [onReadyChange]);

  useEffect(() => {
    onSearchInAreaRef.current = onSearchInArea;
  }, [onSearchInArea]);

  useEffect(() => {
    mobileCardModeRef.current = mobileCardMode;
  }, [mobileCardMode]);

  const listingSummariesById = useMemo(() => {
    const summaries = new Map<string, string>();

    listingsWithCoordinates.forEach((listing) => {
      summaries.set(listing.id, getDetailsSummaryByFields(listing.primaryCategory.schema?.fields, listing.details));
    });

    return summaries;
  }, [listingsWithCoordinates]);

  const markerDescriptors = useMemo<MarkerDescriptor[]>(
    () =>
      listingsWithCoordinates.map((listing) => ({
        iconId: getMarkerIconId(listing.primaryCategory.iconName),
        listing,
        openingState: getMarkerOpeningState(listing),
        popupData: {
          categoryLabel: listing.primaryCategory.label,
          summary: listingSummariesById.get(listing.id) ?? "",
          title: listing.title
        }
      })),
    [listingSummariesById, listingsWithCoordinates]
  );

  const markerDescriptorsById = useMemo(
    () => new Map(markerDescriptors.map((descriptor) => [descriptor.listing.id, descriptor])),
    [markerDescriptors]
  );

  useEffect(() => {
    markerDescriptorsByIdRef.current = markerDescriptorsById;
  }, [markerDescriptorsById]);

  const applyIgnoreIdleWindow = useCallback(() => {
    if (ignoreIdleTimeoutRef.current) {
      window.clearTimeout(ignoreIdleTimeoutRef.current);
    }

    ignoreNextIdleRef.current = true;
    ignoreIdleTimeoutRef.current = window.setTimeout(() => {
      ignoreNextIdleRef.current = false;
      ignoreIdleTimeoutRef.current = null;
    }, IGNORE_IDLE_WINDOW_MS);
  }, []);

  const closeDesktopPopup = useCallback(() => {
    infoWindowRef.current?.close();
    infoWindowRef.current = null;
    setPopupListingId(null);
  }, []);

  const clearMapResources = useCallback(() => {
    if (ignoreIdleTimeoutRef.current) {
      window.clearTimeout(ignoreIdleTimeoutRef.current);
      ignoreIdleTimeoutRef.current = null;
    }

    closeDesktopPopup();

    if (window.google?.maps) {
      markersRef.current.forEach((marker) => {
        window.google.maps.event.clearInstanceListeners(marker);
      });
    }

    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    markersRef.current.clear();

    if (mapRef.current && window.google?.maps) {
      window.google.maps.event.clearInstanceListeners(mapRef.current);
    }

    mapRef.current = null;
    mapReadyRef.current = false;
    setSelectedListingId(null);
    setMapHoveredListingId(null);
    setIsMapReady(false);
    setIsSearchInAreaVisible(false);
    onReadyChangeRef.current?.(false);
  }, [closeDesktopPopup]);

  const markListingVisited = useCallback((listingId: string) => {
    if (visitedListingIdsRef.current.has(listingId)) {
      return;
    }

    visitedListingIdsRef.current.add(listingId);
    setVisitedListingIdsState((currentValue) => [...currentValue, listingId]);
  }, []);

  useImperativeHandle(
    mapHandleRef,
    () => ({
      setExternalHoveredListingId: (listingId) => {
        setExternalHoveredListingId(listingId);
      }
    }),
    []
  );

  useEffect(() => {
    if (externalHoveredListingId && !markerDescriptorsById.has(externalHoveredListingId)) {
      setExternalHoveredListingId(null);
    }

    if (selectedListingId && !markerDescriptorsById.has(selectedListingId)) {
      setSelectedListingId(null);
    }

    if (popupListingId && !markerDescriptorsById.has(popupListingId)) {
      closeDesktopPopup();
    }

    if (mapHoveredListingId && !markerDescriptorsById.has(mapHoveredListingId)) {
      setMapHoveredListingId(null);
    }

  }, [closeDesktopPopup, externalHoveredListingId, mapHoveredListingId, markerDescriptorsById, popupListingId, selectedListingId]);

  const selectedListing = useMemo(
    () => (selectedListingId ? markerDescriptorsById.get(selectedListingId)?.listing ?? null : null),
    [markerDescriptorsById, selectedListingId]
  );
  const selectedListingSummary = selectedListing ? listingSummariesById.get(selectedListing.id) ?? "" : "";
  const visitedListingIds = useMemo(() => new Set(visitedListingIdsState), [visitedListingIdsState]);

  const openDesktopPopupForListing = useCallback(
    (listingId: string) => {
      const map = mapRef.current;
      const marker = markersRef.current.get(listingId);
      const descriptor = markerDescriptorsByIdRef.current.get(listingId);

      if (!map || !marker || !descriptor || mobileCardModeRef.current) {
        return;
      }

      applyIgnoreIdleWindow();

      closeDesktopPopup();

      const infoWindow = new google.maps.InfoWindow({
        content: buildPopupContent(descriptor.popupData),
        maxWidth: 384
      });

      infoWindow.addListener("closeclick", () => {
        if (infoWindowRef.current === infoWindow) {
          infoWindowRef.current = null;
        }
        setPopupListingId((currentValue) => (currentValue === listingId ? null : currentValue));
      });

      infoWindowRef.current = infoWindow;
      setPopupListingId(listingId);
      infoWindow.open({ anchor: marker, map, shouldFocus: false });
    },
    [applyIgnoreIdleWindow, closeDesktopPopup]
  );

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) {
      return;
    }

    if (!hasGoogleMapsApiKey()) {
      setMapError("Google Maps is unavailable until NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is configured.");
      onReadyChangeRef.current?.(true);
      return;
    }

    let isDisposed = false;
    onReadyChangeRef.current?.(false);
    setMapError(null);
    setIsMapReady(false);
    mapReadyRef.current = false;

    loadGoogleMapsApi()
      .then((googleMaps) => {
        if (isDisposed || !mapNodeRef.current || mapRef.current) {
          return;
        }

        const initialListings = initialListingsRef.current ?? [];
        const initialBounds = initialListings.length > 1 ? buildBoundsFromListings(initialListings) : null;
        const initialCenter = initialListings[0] ? toLatLngLiteral(initialListings[0]) : DEFAULT_MAP_CENTER;
        const initialZoom = initialListings[0] ? LISTING_MAP_ZOOM : DEFAULT_MAP_ZOOM;

        const map = new googleMaps.Map(mapNodeRef.current, {
          center: initialCenter,
          clickableIcons: false,
          fullscreenControl: false,
          gestureHandling: "greedy",
          mapTypeControl: false,
          scrollwheel: true,
          streetViewControl: false,
          zoom: initialZoom,
          zoomControl: true
        });

        mapRef.current = map;

        if (initialBounds) {
          initialViewRef.current = { bounds: initialBounds };
          applyIgnoreIdleWindow();
          map.fitBounds(toBoundsLiteral(initialBounds), FIT_BOUNDS_PADDING);
        } else {
          initialViewRef.current = { center: initialCenter, zoom: initialZoom };
        }

        map.addListener("click", () => {
          closeDesktopPopup();
          setSelectedListingId(null);
        });

        map.addListener("idle", () => {
          if (isDisposed) {
            return;
          }

          const bounds = map.getBounds();
          if (!bounds) {
            return;
          }

          pendingBoundsRef.current = toMapBounds(bounds);

          if (!mapReadyRef.current) {
            mapReadyRef.current = true;
            setIsMapReady(true);
            onReadyChangeRef.current?.(true);
            setIsSearchInAreaVisible(false);
            return;
          }

          if (!onSearchInAreaRef.current) {
            return;
          }

          if (ignoreNextIdleRef.current) {
            return;
          }

          setIsSearchInAreaVisible(true);
        });
      })
      .catch((error) => {
        console.error("Failed to initialize Google Maps", error);
        if (isDisposed) {
          return;
        }

        setMapError("Google Maps could not be loaded. Check the API key restrictions and network access.");
        onReadyChangeRef.current?.(true);
      });

    return () => {
      isDisposed = true;
      clearMapResources();
    };
  }, [applyIgnoreIdleWindow, clearMapResources, closeDesktopPopup]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) {
      return;
    }

    const googleMaps = window.google.maps;
    const nextListingIds = new Set(markerDescriptors.map((descriptor) => descriptor.listing.id));

    markersRef.current.forEach((marker, listingId) => {
      if (nextListingIds.has(listingId)) {
        return;
      }

      googleMaps.event.clearInstanceListeners(marker);
      marker.setMap(null);
      markersRef.current.delete(listingId);
    });

    markerDescriptors.forEach((descriptor) => {
      const listingId = descriptor.listing.id;
      let marker = markersRef.current.get(listingId);

      if (!marker) {
        marker = new googleMaps.Marker({
          clickable: true,
          map,
          position: toLatLngLiteral(descriptor.listing)
        });

        // Set initial icon (SVG for fast loading)
        marker.setIcon(
          createGoogleMarkerIcon(googleMaps, {
            iconId: descriptor.iconId,
            isActive: false,
            isVisited: visitedListingIdsRef.current.has(listingId),
            openingState: descriptor.openingState
          })
        );

        // Async update to PNG for better zoom performance
        createGoogleMarkerIconAsync(googleMaps, {
          iconId: descriptor.iconId,
          isActive: false,
          isVisited: visitedListingIdsRef.current.has(listingId),
          openingState: descriptor.openingState
        }).then((icon) => {
          if (markersRef.current.get(listingId) === marker) {
            marker?.setIcon(icon);
          }
        }).catch(() => {
          // Keep SVG if PNG fails
        });

        marker.addListener("mouseover", () => {
          map.getDiv().style.cursor = "pointer";
          setMapHoveredListingId((currentValue) => (currentValue === listingId ? currentValue : listingId));
        });

        marker.addListener("mouseout", () => {
          map.getDiv().style.cursor = "";
          setMapHoveredListingId((currentValue) => (currentValue === listingId ? null : currentValue));
        });

        marker.addListener("click", () => {
          markListingVisited(listingId);

          if (mobileCardModeRef.current) {
            setSelectedListingId(listingId);
            return;
          }

          openDesktopPopupForListing(listingId);
        });

        markersRef.current.set(listingId, marker);
      }

      marker.setPosition(toLatLngLiteral(descriptor.listing));
    });

    if (popupListingId && !mobileCardModeRef.current && markersRef.current.has(popupListingId)) {
      openDesktopPopupForListing(popupListingId);
    }
  }, [isMapReady, markerDescriptors, markListingVisited, openDesktopPopupForListing, popupListingId]);

  useEffect(() => {
    if (!window.google?.maps) {
      return;
    }

    const googleMaps = window.google.maps;
    const activeListingIds = buildActiveListingIds({
      externalHoveredListingId,
      mapHoveredListingId,
      popupListingId,
      selectedListingId,
    });

    markersRef.current.forEach((marker, listingId) => {
      const descriptor = markerDescriptorsById.get(listingId);
      if (!descriptor) {
        return;
      }

      const isActive = activeListingIds.has(listingId);
      const isVisited = visitedListingIds.has(listingId);

      // Update icon with PNG for smoother zoom transitions
      createGoogleMarkerIconAsync(googleMaps, {
        iconId: descriptor.iconId,
        isActive,
        isVisited,
        openingState: descriptor.openingState
      }).then((icon) => {
        if (markersRef.current.get(listingId) === marker) {
          marker?.setIcon(icon);
        }
      }).catch(() => {
        // Fallback to SVG
        marker?.setIcon(
          createGoogleMarkerIcon(googleMaps, {
            iconId: descriptor.iconId,
            isActive,
            isVisited,
            openingState: descriptor.openingState
          })
        );
      });

      marker.setZIndex(isActive ? 20 : isVisited ? 10 : 1);
    });
  }, [externalHoveredListingId, isMapReady, mapHoveredListingId, markerDescriptorsById, popupListingId, selectedListingId, visitedListingIds]);

  useEffect(() => {
    if (!popupListingId || mobileCardMode) {
      closeDesktopPopup();
      return;
    }

    openDesktopPopupForListing(popupListingId);
  }, [closeDesktopPopup, mobileCardMode, openDesktopPopupForListing, popupListingId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isVisible) {
      return;
    }

    const currentCenter = map.getCenter();
    const frameId = window.requestAnimationFrame(() => {
      google.maps.event.trigger(map, "resize");

      if (currentCenter) {
        map.setCenter(currentCenter);
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isVisible]);

  const resetMapView = useCallback(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    // Recalcular bounds baseado nas listings atuais
    const currentBounds = listingsWithCoordinates.length > 1
      ? buildBoundsFromListings(listingsWithCoordinates)
      : null;
    const currentCenter = listingsWithCoordinates[0]
      ? toLatLngLiteral(listingsWithCoordinates[0])
      : DEFAULT_MAP_CENTER;
    const currentZoom = listingsWithCoordinates[0]
      ? LISTING_MAP_ZOOM
      : DEFAULT_MAP_ZOOM;

    applyIgnoreIdleWindow();
    closeDesktopPopup();
    setSelectedListingId(null);
    setIsSearchInAreaVisible(false);

    if (currentBounds) {
      pendingBoundsRef.current = currentBounds;
      map.fitBounds(toBoundsLiteral(currentBounds), FIT_BOUNDS_PADDING);
      return;
    }

    map.panTo(currentCenter);
    map.setZoom(currentZoom);
  }, [applyIgnoreIdleWindow, closeDesktopPopup, listingsWithCoordinates]);

  useEffect(() => {
    window.addEventListener("porto-santo-guide:reset", resetMapView);
    return () => window.removeEventListener("porto-santo-guide:reset", resetMapView);
  }, [resetMapView]);

  useEffect(() => {
    window.addEventListener("porto-santo-guide:reset-map", resetMapView);
    return () => window.removeEventListener("porto-santo-guide:reset-map", resetMapView);
  }, [resetMapView]);

  return (
    <div className="relative h-full w-full bg-white">
      <div
        ref={mapNodeRef}
        className={`h-full w-full ${(isMapReady || mapError) ? "opacity-100" : "opacity-0"}`}
      />

      {mapError ? (
        <div className="absolute inset-0 grid place-items-center bg-white px-6 text-center text-sm text-gray-500">
          {mapError}
        </div>
      ) : null}

      {mobileCardMode && selectedListing ? (
        <div className="pointer-events-none absolute inset-x-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom)+0.5rem)] z-20">
          <div className="listingMapMobileCard pointer-events-auto">
            <div className="listingMapPopup">
              <strong className="listingMapPopupTitle">{selectedListing.title}</strong>
              <p className="listingMapPopupMeta">{selectedListing.primaryCategory.label}</p>
              {selectedListingSummary ? <p className="listingMapPopupSummary">{selectedListingSummary}</p> : null}
            </div>
          </div>
        </div>
      ) : null}

      {isMapReady && isSearchInAreaVisible && onSearchInArea ? (
        <PublicFilterButton
          className="absolute left-1/2 top-5 z-30 -translate-x-1/2"
          iconLeading={RefreshCw05}
          onClick={() => {
            if (!pendingBoundsRef.current || !onSearchInArea) {
              return;
            }

            closeDesktopPopup();
            setSelectedListingId(null);
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
