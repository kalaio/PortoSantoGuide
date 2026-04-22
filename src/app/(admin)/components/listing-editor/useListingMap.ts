"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { DEFAULT_LATITUDE, DEFAULT_LONGITUDE, getCoordinatesFromForm } from "@/app/(admin)/components/listing-editor/helpers";
import type { ListingFormState } from "@/app/(admin)/components/listing-editor/types";
import { hasGoogleMapsApiKey, loadGoogleMapsApi } from "@/lib/google-maps";

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
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const formRef = useRef(form);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  const haveSameCoordinates = useCallback((left: [number, number], right: [number, number]) => {
    return left[0] === right[0] && left[1] === right[1];
  }, []);

  const syncMarkerToMap = useCallback((nextCoordinates: [number, number] | null, options?: { animate?: boolean }) => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const coordinates = nextCoordinates ?? [DEFAULT_LONGITUDE, DEFAULT_LATITUDE];
    const position = { lat: coordinates[1], lng: coordinates[0] };

    if (!markerRef.current) {
      const marker = new google.maps.Marker({
        draggable: true,
        map,
        position
      });

      marker.addListener("dragend", () => {
        const nextPosition = marker.getPosition();
        if (!nextPosition) {
          return;
        }

        setForm((previous) => ({
          ...previous,
          latitude: nextPosition.lat().toFixed(6),
          longitude: nextPosition.lng().toFixed(6)
        }));
      });

      markerRef.current = marker;
    } else {
      const markerPosition = markerRef.current.getPosition();
      const currentCoordinates = markerPosition ? ([markerPosition.lng(), markerPosition.lat()] as [number, number]) : null;

      if (!currentCoordinates || !haveSameCoordinates(currentCoordinates, coordinates)) {
        markerRef.current.setPosition(position);
      }
    }

    const currentCenter = map.getCenter();
    const currentCoordinates = currentCenter ? ([currentCenter.lng(), currentCenter.lat()] as [number, number]) : null;
    const isAlreadyCentered = currentCoordinates ? haveSameCoordinates(currentCoordinates, coordinates) : false;

    if (options?.animate === false || isAlreadyCentered) {
      if (!isAlreadyCentered) {
        map.setCenter(position);
      }

      return;
    }

    map.panTo(position);
  }, [haveSameCoordinates, setForm]);

  useEffect(() => {
    let isCancelled = false;

    if (!isMapEnabled) {
      if (markerRef.current) {
        if (window.google?.maps) {
          window.google.maps.event.clearInstanceListeners(markerRef.current);
        }
        markerRef.current.setMap(null);
      }

      markerRef.current = null;

      if (mapRef.current) {
        if (window.google?.maps) {
          window.google.maps.event.clearInstanceListeners(mapRef.current);
        }
      }

      mapRef.current = null;
      return;
    }

    if (!hasGoogleMapsApiKey()) {
      return;
    }

    async function initializeMap() {
      if (!mapNodeRef.current || mapRef.current) {
        return;
      }

      await loadGoogleMapsApi();

      if (isCancelled || !mapNodeRef.current || mapRef.current) {
        return;
      }

      const initialCoordinates = getCoordinatesFromForm(formRef.current) ?? [DEFAULT_LONGITUDE, DEFAULT_LATITUDE];
      const initialCenter = { lat: initialCoordinates[1], lng: initialCoordinates[0] };

      const map = new google.maps.Map(mapNodeRef.current, {
        center: initialCenter,
        clickableIcons: false,
        fullscreenControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        zoom: 10.8,
        zoomControl: true
      });

      map.addListener("click", (event: google.maps.MapMouseEvent) => {
        const latLng = event.latLng;
        if (!latLng) {
          return;
        }

        setForm((previous) => ({
          ...previous,
          latitude: latLng.lat().toFixed(6),
          longitude: latLng.lng().toFixed(6)
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

      syncMarkerToMap(getCoordinatesFromForm(formRef.current), { animate: false });
    }

    initializeMap().catch(() => {
      // keep form usable even if map initialization fails
    });

    return () => {
      isCancelled = true;

      if (markerRef.current) {
        if (window.google?.maps) {
          window.google.maps.event.clearInstanceListeners(markerRef.current);
        }
        markerRef.current.setMap(null);
      }

      markerRef.current = null;

      if (mapRef.current) {
        if (window.google?.maps) {
          window.google.maps.event.clearInstanceListeners(mapRef.current);
        }
      }

      mapRef.current = null;
    };
  }, [initializeDefaultCoordinates, isMapEnabled, setForm, syncMarkerToMap]);

  useEffect(() => {
    syncMarkerToMap(getCoordinatesFromForm({ latitude: form.latitude, longitude: form.longitude }));
  }, [form.latitude, form.longitude, syncMarkerToMap]);

  return { mapNodeRef };
}
