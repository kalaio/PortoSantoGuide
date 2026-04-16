"use client";

import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from "react";
import { RefreshCw05 } from "@untitledui/icons";
import maplibregl from "maplibre-gl";
import PublicFilterButton from "@/components/frontend/PublicFilterButton";
import { getDetailsSummaryByFields, getFoodOpeningState, hasSchemaField } from "@/lib/listing-details";
import { normalizeUiIconName, renderUiIconSvg, UI_ICON_IDS, type UiIconId } from "@/lib/ui-icons";
import type { Listing } from "@/types/listing";
import "maplibre-gl/dist/maplibre-gl.css";

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
  center?: [number, number];
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

type MarkerFeatureProperties = {
  iconImageActive: string;
  iconImageDefault: string;
  isOpen: boolean;
  isVisited: boolean;
  listingId: string;
  openingState: "open" | "closed" | "";
};

type MarkerFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Point, MarkerFeatureProperties>;

const MARKER_SOURCE_ID = "listing-map-markers";
const MARKER_LAYER_INACTIVE_BASE_ID = "listing-map-marker-inactive-base";
const MARKER_LAYER_INACTIVE_ICON_ID = "listing-map-marker-inactive-icon";
const MARKER_LAYER_INACTIVE_STATUS_ID = "listing-map-marker-inactive-status";
const MARKER_LAYER_ACTIVE_BASE_ID = "listing-map-marker-active-base";
const MARKER_LAYER_ACTIVE_ICON_ID = "listing-map-marker-active-icon";
const MARKER_LAYER_ACTIVE_STATUS_ID = "listing-map-marker-active-status";
const MARKER_LAYER_HIT_ID = "listing-map-marker-hit";

const DEFAULT_MARKER_ICON_ID: UiIconId = "map-pin";
const ICON_ACTIVE_STROKE = "#076d70";
const ICON_DEFAULT_STROKE = "#ffffff";
const MARKER_ACTIVE_FILL = "#ffffff";
const MARKER_ACTIVE_STROKE = "#076d70";
const MARKER_DEFAULT_FILL = "#076d70";
const MARKER_DEFAULT_STROKE = "#ffffff";
const MARKER_HIT_RADIUS = 20;
const MARKER_RADIUS = 18;
const MARKER_STATUS_RADIUS = 5;
const MARKER_STATUS_TRANSLATE: [number, number] = [15, -15];
const EMPTY_ACTIVE_MARKER_FILTER: maplibregl.LegacyFilterSpecification = ["==", "listingId", "__psg_no_active_marker__"];

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

const toMapBounds = (bounds: maplibregl.LngLatBounds): MapBounds => ({
  north: bounds.getNorth(),
  south: bounds.getSouth(),
  east: bounds.getEast(),
  west: bounds.getWest()
});

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

function buildMarkerIconImageName(iconId: UiIconId, variant: "active" | "default") {
  return `listing-map-icon-${iconId}-${variant}`;
}

function buildMarkerIconDataUrl(iconId: UiIconId, stroke: string) {
  const svg = renderUiIconSvg(iconId, stroke, 48) ?? renderUiIconSvg(DEFAULT_MARKER_ICON_ID, stroke, 48) ?? "";
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function loadMapImage(map: maplibregl.Map, name: string, url: string) {
  return new Promise<void>((resolve, reject) => {
    if (map.hasImage(name)) {
      resolve();
      return;
    }

    const image = new Image();
    image.decoding = "async";

    image.onload = () => {
      if (!map.hasImage(name)) {
        map.addImage(name, image, { pixelRatio: 2 });
      }

      resolve();
    };

    image.onerror = () => {
      reject(new Error(`Map image '${name}' could not be loaded.`));
    };

    image.src = url;
  });
}

async function ensureMarkerImages(map: maplibregl.Map) {
  const defaultDefaultUrl = buildMarkerIconDataUrl(DEFAULT_MARKER_ICON_ID, ICON_DEFAULT_STROKE);
  const defaultActiveUrl = buildMarkerIconDataUrl(DEFAULT_MARKER_ICON_ID, ICON_ACTIVE_STROKE);

  await Promise.all(
    UI_ICON_IDS.flatMap((iconId) => {
      const defaultImageName = buildMarkerIconImageName(iconId, "default");
      const activeImageName = buildMarkerIconImageName(iconId, "active");

      return [
        loadMapImage(map, defaultImageName, buildMarkerIconDataUrl(iconId, ICON_DEFAULT_STROKE)).catch((error) => {
          if (iconId === DEFAULT_MARKER_ICON_ID) {
            throw error;
          }

          console.warn(`Falling back to default map marker icon for '${iconId}'.`, error);
          return loadMapImage(map, defaultImageName, defaultDefaultUrl);
        }),
        loadMapImage(map, activeImageName, buildMarkerIconDataUrl(iconId, ICON_ACTIVE_STROKE)).catch((error) => {
          if (iconId === DEFAULT_MARKER_ICON_ID) {
            throw error;
          }

          console.warn(`Falling back to active default map marker icon for '${iconId}'.`, error);
          return loadMapImage(map, activeImageName, defaultActiveUrl);
        })
      ];
    })
  );
}

function buildMarkerFeatureCollection(descriptors: MarkerDescriptor[], visitedListingIds: Set<string> = new Set()): MarkerFeatureCollection {
  return {
    type: "FeatureCollection",
    features: descriptors.map((descriptor) => ({
      type: "Feature",
      id: descriptor.listing.id,
      geometry: {
        type: "Point",
        coordinates: [descriptor.listing.longitude, descriptor.listing.latitude]
      },
      properties: {
        iconImageActive: buildMarkerIconImageName(descriptor.iconId, "active"),
        iconImageDefault: buildMarkerIconImageName(descriptor.iconId, "default"),
        isOpen: descriptor.openingState === "open",
        isVisited: visitedListingIds.has(descriptor.listing.id),
        listingId: descriptor.listing.id,
        openingState: descriptor.openingState ?? ""
      }
    }))
  };
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

function buildActiveMarkerLayerFilter(activeListingIds: Set<string>): maplibregl.LegacyFilterSpecification {
  if (activeListingIds.size === 0) {
    return EMPTY_ACTIVE_MARKER_FILTER;
  }

  return ["in", "listingId", ...activeListingIds];
}

function addMarkerLayers(map: maplibregl.Map) {
  const statusFilter: maplibregl.LegacyFilterSpecification = ["!=", "openingState", ""];
  const emptyActiveStatusFilter: maplibregl.LegacyFilterSpecification = ["all", EMPTY_ACTIVE_MARKER_FILTER, statusFilter];

  map.addLayer({
    id: MARKER_LAYER_INACTIVE_BASE_ID,
    source: MARKER_SOURCE_ID,
    type: "circle",
    paint: {
      "circle-color": MARKER_DEFAULT_FILL,
      "circle-radius": MARKER_RADIUS,
      "circle-stroke-color": [
        "case",
        ["boolean", ["get", "isVisited"], false],
        MARKER_ACTIVE_STROKE,
        MARKER_DEFAULT_STROKE
      ],
      "circle-stroke-width": 1
    }
  } as unknown as maplibregl.CircleLayerSpecification);

  map.addLayer({
    id: MARKER_LAYER_INACTIVE_ICON_ID,
    source: MARKER_SOURCE_ID,
    type: "symbol",
    layout: {
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      "icon-image": ["get", "iconImageDefault"],
      "icon-size": 0.68
    }
  } as unknown as maplibregl.SymbolLayerSpecification);

  map.addLayer({
    id: MARKER_LAYER_INACTIVE_STATUS_ID,
    source: MARKER_SOURCE_ID,
    type: "circle",
    filter: statusFilter,
    paint: {
      "circle-color": ["case", ["boolean", ["get", "isOpen"], false], "rgb(23 178 106)", "rgb(163 163 163)"],
      "circle-radius": MARKER_STATUS_RADIUS,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 1,
      "circle-translate": MARKER_STATUS_TRANSLATE
    }
  } as unknown as maplibregl.CircleLayerSpecification);

  map.addLayer({
    id: MARKER_LAYER_ACTIVE_BASE_ID,
    source: MARKER_SOURCE_ID,
    type: "circle",
    filter: EMPTY_ACTIVE_MARKER_FILTER,
    paint: {
      "circle-color": MARKER_ACTIVE_FILL,
      "circle-radius": MARKER_RADIUS,
      "circle-stroke-color": MARKER_ACTIVE_STROKE,
      "circle-stroke-width": 1
    }
  } as unknown as maplibregl.CircleLayerSpecification);

  map.addLayer({
    id: MARKER_LAYER_ACTIVE_ICON_ID,
    source: MARKER_SOURCE_ID,
    type: "symbol",
    filter: EMPTY_ACTIVE_MARKER_FILTER,
    layout: {
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      "icon-image": ["get", "iconImageActive"],
      "icon-size": 0.68
    }
  } as unknown as maplibregl.SymbolLayerSpecification);

  map.addLayer({
    id: MARKER_LAYER_ACTIVE_STATUS_ID,
    source: MARKER_SOURCE_ID,
    type: "circle",
    filter: emptyActiveStatusFilter,
    paint: {
      "circle-color": ["case", ["boolean", ["get", "isOpen"], false], "rgb(23 178 106)", "rgb(163 163 163)"],
      "circle-radius": MARKER_STATUS_RADIUS,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 1,
      "circle-translate": MARKER_STATUS_TRANSLATE
    }
  } as unknown as maplibregl.CircleLayerSpecification);

  map.addLayer({
    id: MARKER_LAYER_HIT_ID,
    source: MARKER_SOURCE_ID,
    type: "circle",
    paint: {
      "circle-color": "rgba(0,0,0,0)",
      "circle-radius": MARKER_HIT_RADIUS,
      "circle-stroke-width": 0
    }
  } as unknown as maplibregl.CircleLayerSpecification);
}

function getFeatureListingId(event: maplibregl.MapLayerMouseEvent) {
  const feature = event.features?.[0];
  const listingId = feature?.properties?.listingId;

  return typeof listingId === "string" ? listingId : null;
}

export default function ListingMap({ isVisible = true, listings, mapHandleRef, mobileCardMode = false, onReadyChange, onSearchInArea }: ListingMapProps) {
  const listingsWithCoordinates = useMemo(() => listings.filter(hasListingCoordinates), [listings]);
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const openPopupRef = useRef<maplibregl.Popup | null>(null);
  const pendingBoundsRef = useRef<MapBounds | null>(null);
  const ignoreNextMoveRef = useRef(false);
  const ignoreMoveTimeoutRef = useRef<number | null>(null);
  const onReadyChangeRef = useRef(onReadyChange);
  const onSearchInAreaRef = useRef(onSearchInArea);
  const skipNextMapClickRef = useRef(false);
  const skipNextMoveEndRef = useRef(false);
  const initialListingsRef = useRef<MappableListing[] | null>(null);
  const initialViewRef = useRef<InitialView | null>(null);
  const markerDescriptorsByIdRef = useRef<Map<string, MarkerDescriptor>>(new Map());
  const mobileCardModeRef = useRef(mobileCardMode);
  const externalHoveredListingIdRef = useRef<string | null>(null);
  const pendingActiveMarkerSyncFrameRef = useRef<number | null>(null);
  const visitedListingIdsRef = useRef<Set<string>>(new Set());
  const [isMapReady, setIsMapReady] = useState(false);
  const [isSearchInAreaVisible, setIsSearchInAreaVisible] = useState(false);
  const [mapHoveredListingId, setMapHoveredListingId] = useState<string | null>(null);
  const [popupListingId, setPopupListingId] = useState<string | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [visitedListingIdsState, setVisitedListingIdsState] = useState<string[]>([]);

  if (!initialListingsRef.current && listingsWithCoordinates.length > 0) {
    initialListingsRef.current = listingsWithCoordinates;
  }

  const styleDefinition = useMemo<maplibregl.StyleSpecification | string>(
    () => process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://tiles.stadiamaps.com/styles/outdoors.json",
    []
  );

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

  const warmMap = useCallback(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) {
      return;
    }

    map.getCenter();
    map.triggerRepaint();
  }, [isMapReady]);

  const syncActiveMarkerFilter = useCallback(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) {
      return;
    }

    if (!map.getLayer(MARKER_LAYER_ACTIVE_BASE_ID) || !map.getLayer(MARKER_LAYER_ACTIVE_ICON_ID) || !map.getLayer(MARKER_LAYER_ACTIVE_STATUS_ID)) {
      return;
    }

    const activeFilter = buildActiveMarkerLayerFilter(
      buildActiveListingIds({
        externalHoveredListingId: externalHoveredListingIdRef.current,
        mapHoveredListingId,
        popupListingId,
        selectedListingId,
      })
    );

    map.setFilter(MARKER_LAYER_ACTIVE_BASE_ID, activeFilter);
    map.setFilter(MARKER_LAYER_ACTIVE_ICON_ID, activeFilter);
    map.setFilter(MARKER_LAYER_ACTIVE_STATUS_ID, ["all", activeFilter, ["!=", "openingState", ""]]);
  }, [isMapReady, mapHoveredListingId, popupListingId, selectedListingId]);

  const scheduleActiveMarkerFilterSync = useCallback(() => {
    if (!isMapReady) {
      return;
    }

    if (pendingActiveMarkerSyncFrameRef.current) {
      window.cancelAnimationFrame(pendingActiveMarkerSyncFrameRef.current);
    }

    pendingActiveMarkerSyncFrameRef.current = window.requestAnimationFrame(() => {
      pendingActiveMarkerSyncFrameRef.current = null;
      syncActiveMarkerFilter();
    });
  }, [isMapReady, syncActiveMarkerFilter]);

  useImperativeHandle(
    mapHandleRef,
    () => ({
      setExternalHoveredListingId: (listingId) => {
        if (externalHoveredListingIdRef.current === listingId) {
          return;
        }

        externalHoveredListingIdRef.current = listingId;
        scheduleActiveMarkerFilterSync();
      }
    }),
    [scheduleActiveMarkerFilterSync]
  );

  useEffect(() => {
    let didClearExternalHoveredListing = false;

    if (externalHoveredListingIdRef.current && !markerDescriptorsById.has(externalHoveredListingIdRef.current)) {
      externalHoveredListingIdRef.current = null;
      didClearExternalHoveredListing = true;
    }

    if (selectedListingId && !markerDescriptorsById.has(selectedListingId)) {
      setSelectedListingId(null);
    }

    if (popupListingId && !markerDescriptorsById.has(popupListingId)) {
      openPopupRef.current?.remove();
      openPopupRef.current = null;
      setPopupListingId(null);
    }

    if (mapHoveredListingId && !markerDescriptorsById.has(mapHoveredListingId)) {
      setMapHoveredListingId(null);
    }

    if (didClearExternalHoveredListing) {
      scheduleActiveMarkerFilterSync();
    }
  }, [mapHoveredListingId, markerDescriptorsById, popupListingId, scheduleActiveMarkerFilterSync, selectedListingId]);

  const selectedListing = useMemo(
    () => (selectedListingId ? markerDescriptorsById.get(selectedListingId)?.listing ?? null : null),
    [markerDescriptorsById, selectedListingId]
  );
  const selectedListingSummary = selectedListing ? listingSummariesById.get(selectedListing.id) ?? "" : "";

  const visitedListingIds = useMemo(() => new Set(visitedListingIdsState), [visitedListingIdsState]);

  const markerFeatureCollection = useMemo(
    () => buildMarkerFeatureCollection(markerDescriptors, visitedListingIds),
    [markerDescriptors, visitedListingIds]
  );
  const markerFeatureCollectionRef = useRef(markerFeatureCollection);

  useEffect(() => {
    markerFeatureCollectionRef.current = markerFeatureCollection;
  }, [markerFeatureCollection]);

  const closeDesktopPopup = useCallback(() => {
    openPopupRef.current?.remove();
    openPopupRef.current = null;
    setPopupListingId(null);
  }, []);

  const markListingVisited = useCallback((listingId: string) => {
    if (visitedListingIdsRef.current.has(listingId)) {
      return;
    }

    visitedListingIdsRef.current.add(listingId);
    setVisitedListingIdsState((currentValue) => [...currentValue, listingId]);
  }, []);

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) {
      return;
    }

    onReadyChangeRef.current?.(false);

    const initialListings = initialListingsRef.current ?? [];
    let mapOptions: maplibregl.MapOptions;

    const didUseInitialBounds = initialListings.length > 1;

    if (didUseInitialBounds) {
      const first = initialListings[0];
      const bounds = new maplibregl.LngLatBounds([first.longitude, first.latitude], [first.longitude, first.latitude]);

      initialListings.slice(1).forEach((listing) => {
        bounds.extend([listing.longitude, listing.latitude]);
      });

      mapOptions = {
        container: mapNodeRef.current,
        style: styleDefinition,
        bounds,
        fitBoundsOptions: { padding: 64, maxZoom: 12 }
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
    let isDisposed = false;

    setIsMapReady(false);
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    const handleMarkerEnter = (event: maplibregl.MapLayerMouseEvent) => {
      const listingId = getFeatureListingId(event);
      map.getCanvas().style.cursor = listingId ? "pointer" : "";
      setMapHoveredListingId((currentValue) => (currentValue === listingId ? currentValue : listingId));
    };

    const handleMarkerLeave = () => {
      map.getCanvas().style.cursor = "";
      setMapHoveredListingId(null);
    };

    const handleMarkerClick = (event: maplibregl.MapLayerMouseEvent) => {
      const listingId = getFeatureListingId(event);
      if (!listingId) {
        return;
      }

      const descriptor = markerDescriptorsByIdRef.current.get(listingId);
      if (!descriptor) {
        return;
      }

      skipNextMapClickRef.current = true;
      markListingVisited(listingId);

      if (mobileCardModeRef.current) {
        setSelectedListingId(listingId);
        return;
      }

      const popup = new maplibregl.Popup({ closeButton: false, offset: 12, maxWidth: "24rem" }).setDOMContent(
        buildPopupContent(descriptor.popupData)
      );

      popup.on("close", () => {
        if (openPopupRef.current === popup) {
          openPopupRef.current = null;
        }
        setPopupListingId((currentValue) => (currentValue === listingId ? null : currentValue));
      });

      closeDesktopPopup();
      openPopupRef.current = popup;
      setPopupListingId(listingId);
      popup.setLngLat([descriptor.listing.longitude, descriptor.listing.latitude]).addTo(map);
    };

    const handleMapClick = () => {
      if (skipNextMapClickRef.current) {
        skipNextMapClickRef.current = false;
        return;
      }

      closeDesktopPopup();
      setSelectedListingId(null);
    };

    const handleMoveEnd = () => {
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

    const setupMap = async () => {
      await ensureMarkerImages(map);
      if (isDisposed) {
        return;
      }

      map.addSource(MARKER_SOURCE_ID, {
        type: "geojson",
        data: markerFeatureCollectionRef.current
      });

      addMarkerLayers(map);

      map.on("mouseenter", MARKER_LAYER_HIT_ID, handleMarkerEnter);
      map.on("mouseleave", MARKER_LAYER_HIT_ID, handleMarkerLeave);
      map.on("click", MARKER_LAYER_HIT_ID, handleMarkerClick);
      map.on("click", handleMapClick);
      map.on("moveend", handleMoveEnd);

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

      mapRef.current = map;
      setIsMapReady(true);
      onReadyChangeRef.current?.(true);
    };

    map.once("load", () => {
      void setupMap().catch((error) => {
        console.error("Failed to initialize listing map layers", error);
      });
    });

    return () => {
      isDisposed = true;
      map.getCanvas().style.cursor = "";

      if (pendingActiveMarkerSyncFrameRef.current) {
        window.cancelAnimationFrame(pendingActiveMarkerSyncFrameRef.current);
        pendingActiveMarkerSyncFrameRef.current = null;
      }

      if (ignoreMoveTimeoutRef.current) {
        window.clearTimeout(ignoreMoveTimeoutRef.current);
        ignoreMoveTimeoutRef.current = null;
      }

      closeDesktopPopup();
      map.remove();
      mapRef.current = null;
      setSelectedListingId(null);
      setMapHoveredListingId(null);
      setPopupListingId(null);
      setIsMapReady(false);
      onReadyChangeRef.current?.(false);
      setIsSearchInAreaVisible(false);
    };
  }, [closeDesktopPopup, markListingVisited, styleDefinition]);

  useEffect(() => {
    if (!isMapReady) {
      return;
    }

    const mapNode = mapNodeRef.current;
    if (!mapNode) {
      return;
    }

    const handleMapWake = () => {
      warmMap();
    };

    const handleWindowFocus = () => {
      warmMap();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        warmMap();
      }
    };

    mapNode.addEventListener("pointerenter", handleMapWake);
    mapNode.addEventListener("pointerdown", handleMapWake);
    mapNode.addEventListener("wheel", handleMapWake);
    mapNode.addEventListener("touchstart", handleMapWake);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mapNode.removeEventListener("pointerenter", handleMapWake);
      mapNode.removeEventListener("pointerdown", handleMapWake);
      mapNode.removeEventListener("wheel", handleMapWake);
      mapNode.removeEventListener("touchstart", handleMapWake);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isMapReady, warmMap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady || !isVisible) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      map.resize();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isMapReady, isVisible]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) {
      return;
    }

    const source = map.getSource(MARKER_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (!source) {
      return;
    }

    source.setData(markerFeatureCollection);
  }, [isMapReady, markerFeatureCollection]);

  useEffect(() => {
    scheduleActiveMarkerFilterSync();
  }, [isMapReady, markerDescriptorsById, scheduleActiveMarkerFilterSync]);

  const resetMapView = useCallback(() => {
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

    closeDesktopPopup();
    setSelectedListingId(null);
    setIsSearchInAreaVisible(false);

    if (view.bounds) {
      const bounds = new maplibregl.LngLatBounds([view.bounds.west, view.bounds.south], [view.bounds.east, view.bounds.north]);
      map.fitBounds(bounds, { padding: 64, maxZoom: 12, duration: 450 });
      pendingBoundsRef.current = view.bounds;
      return;
    }

    if (view.center && typeof view.zoom === "number") {
      map.easeTo({ center: view.center, zoom: view.zoom, duration: 450 });
      pendingBoundsRef.current = toMapBounds(map.getBounds());
    }
  }, [closeDesktopPopup]);

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
      <div ref={mapNodeRef} className={`h-full w-full transition-opacity duration-200 ${isMapReady ? "opacity-100" : "opacity-0"}`} />

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
