"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { DEFAULT_LATITUDE, DEFAULT_LONGITUDE, getCoordinatesFromForm } from "@/components/admin/listing-editor/helpers";
import type { ListingFormState } from "@/components/admin/listing-editor/types";

type UseListingMapParams = {
  form: ListingFormState;
  setForm: Dispatch<SetStateAction<ListingFormState>>;
  initializeDefaultCoordinates?: boolean;
  isMapEnabled?: boolean;
};

export function useListingMap({
  form,
  setForm,
  initializeDefaultCoordinates = false,
  isMapEnabled = true
}: UseListingMapParams) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<MapLibreMarker | null>(null);
  const maplibreRef = useRef<typeof import("maplibre-gl") | null>(null);
  const formRef = useRef(form);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  const syncMarkerToMap = useCallback((nextForm: ListingFormState, options?: { animate?: boolean }) => {
    const map = mapRef.current;
    const maplibre = maplibreRef.current;

    if (!map || !maplibre) {
      return;
    }

    const coordinates = getCoordinatesFromForm(nextForm) ?? [DEFAULT_LONGITUDE, DEFAULT_LATITUDE];

    if (!markerRef.current) {
      const marker = new maplibre.Marker({ color: "var(--primary-v2)", draggable: true })
        .setLngLat(coordinates)
        .addTo(map);

      marker.on("dragend", () => {
        const position = marker.getLngLat();
        setForm((previous) => ({
          ...previous,
          latitude: position.lat.toFixed(6),
          longitude: position.lng.toFixed(6)
        }));
      });

      markerRef.current = marker;
    } else {
      markerRef.current.setLngLat(coordinates);
    }

    if (options?.animate === false) {
      map.jumpTo({ center: coordinates });
      return;
    }

    map.easeTo({ center: coordinates, duration: 500 });
  }, [setForm]);

  useEffect(() => {
    const styleUrl =
      process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://tiles.stadiamaps.com/styles/outdoors.json";

    let isCancelled = false;

    if (!isMapEnabled) {
      markerRef.current?.remove();
      markerRef.current = null;
      maplibreRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      return;
    }

    async function initializeMap() {
      if (!mapNodeRef.current || mapRef.current) {
        return;
      }

      const maplibre = await import("maplibre-gl");

      if (isCancelled || !mapNodeRef.current || mapRef.current) {
        return;
      }

      maplibreRef.current = maplibre;

      const initialCoordinates = getCoordinatesFromForm(formRef.current) ?? [DEFAULT_LONGITUDE, DEFAULT_LATITUDE];

      const map = new maplibre.Map({
        container: mapNodeRef.current,
        style: styleUrl,
        center: initialCoordinates,
        zoom: 10.8
      });

      map.addControl(new maplibre.NavigationControl(), "top-right");

      map.on("click", (event) => {
        setForm((previous) => ({
          ...previous,
          latitude: event.lngLat.lat.toFixed(6),
          longitude: event.lngLat.lng.toFixed(6)
        }));
      });

      mapRef.current = map;

      if (
        initializeDefaultCoordinates &&
        formRef.current.latitude.trim().length === 0 &&
        formRef.current.longitude.trim().length === 0
      ) {
        setForm((previous) => ({
          ...previous,
          latitude: DEFAULT_LATITUDE.toFixed(6),
          longitude: DEFAULT_LONGITUDE.toFixed(6)
        }));
      }

      syncMarkerToMap(formRef.current, { animate: false });

      requestAnimationFrame(() => {
        map.resize();
      });
    }

    initializeMap().catch(() => {
      // keep form usable even if map initialization fails
    });

    return () => {
      isCancelled = true;
      markerRef.current?.remove();
      markerRef.current = null;
      maplibreRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [initializeDefaultCoordinates, isMapEnabled, setForm, syncMarkerToMap]);

  useEffect(() => {
    syncMarkerToMap(form);
  }, [form, syncMarkerToMap]);

  return { mapNodeRef };
}
