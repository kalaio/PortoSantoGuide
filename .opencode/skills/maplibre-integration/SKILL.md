---
name: maplibre-integration
description: MapLibre GL JS integration patterns for React, markers, popups, and map interactions
license: MIT
compatibility: opencode
metadata:
  library: MapLibre GL
  version: "5.x"
  use-case: Maps and Geolocation
---

## What This Skill Covers

MapLibre GL JS integration patterns for the PortoSantoGuide map features.

## Setup

### Installation
```bash
npm install maplibre-gl
```

### Basic Map Component
```tsx
'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapProps {
  center: [number, number];
  zoom?: number;
  markers?: Array<{
    id: string;
    coordinates: [number, number];
    title?: string;
  }>;
  onMarkerClick?: (id: string) => void;
}

export function Map({ center, zoom = 12, markers = [], onMarkerClick }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center,
      zoom,
    });

    map.current.addControl(new maplibregl.NavigationControl());

    return () => {
      map.current?.remove();
    };
  }, [center, zoom]);

  // Add markers
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach(markerData => {
      const marker = new maplibregl.Marker()
        .setLngLat(markerData.coordinates)
        .addTo(map.current!);
      
      if (markerData.title) {
        marker.setPopup(
          new maplibregl.Popup().setHTML(`<h3>${markerData.title}</h3>`)
        );
      }
      
      marker.getElement().addEventListener('click', () => {
        onMarkerClick?.(markerData.id);
      });
      
      markersRef.current.push(marker);
    });
  }, [markers, onMarkerClick]);

  return <div ref={mapContainer} className="w-full h-96 rounded-lg" />;
}
```

## Markers and Popups

### Custom Marker
```tsx
const el = document.createElement('div');
el.className = 'custom-marker';
el.style.backgroundImage = 'url(/marker-icon.png)';
el.style.width = '30px';
el.style.height = '40px';

const marker = new maplibregl.Marker(el)
  .setLngLat(coordinates)
  .setPopup(
    new maplibregl.Popup({ offset: 25 })
      .setHTML(`
        <div class="p-2">
          <h3 class="font-bold">${listing.name}</h3>
          <p>${listing.description}</p>
        </div>
      `)
  )
  .addTo(map);
```

## Map Events

```tsx
useEffect(() => {
  if (!map.current) return;

  const handleClick = (e: maplibregl.MapMouseEvent) => {
    console.log('Clicked at:', e.lngLat);
  };

  const handleMove = () => {
    const center = map.current?.getCenter();
    const zoom = map.current?.getZoom();
    // Save to URL or state
  };

  map.current.on('click', handleClick);
  map.current.on('moveend', handleMove);

  return () => {
    map.current?.off('click', handleClick);
    map.current?.off('moveend', handleMove);
  };
}, []);
```

## Geolocation

```tsx
useEffect(() => {
  if (!map.current || !navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      
      map.current?.flyTo({
        center: [longitude, latitude],
        zoom: 15,
      });

      // Add user location marker
      new maplibregl.Marker({ color: '#3b82f6' })
        .setLngLat([longitude, latitude])
        .addTo(map.current!);
    },
    (error) => console.error('Geolocation error:', error)
  );
}, []);
```

## Search Integration

```tsx
interface GeocodingResult {
  place_name: string;
  center: [number, number];
}

async function searchLocation(query: string): Promise<GeocodingResult[]> {
  const response = await fetch(
    `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${API_KEY}`
  );
  const data = await response.json();
  return data.features;
}
```

## Server Component Pattern

```tsx
// page.tsx (Server Component)
import { prisma } from '@/lib/prisma';
import { MapClient } from './MapClient';

export default async function MapPage() {
  const listings = await prisma.listing.findMany({
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
    }
  });

  const markers = listings.map(l => ({
    id: l.id,
    coordinates: [l.longitude, l.latitude] as [number, number],
    title: l.name,
  }));

  return <MapClient markers={markers} />;
}

// MapClient.tsx (Client Component)
'use client';

export function MapClient({ markers }: { markers: MapMarker[] }) {
  // Map implementation
}
```

## When to Use

Use this skill when:
- Implementing map features
- Adding markers and popups
- Handling geolocation
- Integrating map search
- Creating location-based UIs
