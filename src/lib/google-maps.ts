import { renderUiIconSvg, type UiIconId } from "@/lib/ui-icons";

type MarkerIconState = {
  iconId: UiIconId;
  isActive: boolean;
  isVisited: boolean;
  openingState: "open" | "closed" | null;
};

declare global {
  interface Window {
    __portoSantoGuideGoogleMapsInit?: () => void;
  }
}

const GOOGLE_MAPS_CALLBACK_NAME = "__portoSantoGuideGoogleMapsInit";
const GOOGLE_MAPS_SCRIPT_ID = "porto-santo-guide-google-maps";
const ICON_ACTIVE_STROKE = "#076d70";
const ICON_DEFAULT_STROKE = "#ffffff";
const MARKER_ACTIVE_FILL = "#ffffff";
const MARKER_ACTIVE_STROKE = "#076d70";
const MARKER_DEFAULT_FILL = "#076d70";
const MARKER_DEFAULT_STROKE = "#ffffff";
const MARKER_SIZE = 36;
const MARKER_CENTER = MARKER_SIZE / 2;
const STATUS_DOT_RADIUS = 5;
const STATUS_DOT_CX = 29;
const STATUS_DOT_CY = 7;

const markerIconUrlCache = new Map<string, string>();

let googleMapsPromise: Promise<typeof google.maps> | null = null;

function buildMarkerIconCacheKey({ iconId, isActive, isVisited, openingState }: MarkerIconState) {
  return [iconId, isActive ? "active" : "default", isVisited ? "visited" : "fresh", openingState ?? "none"].join(":");
}

function buildNestedIconSvg(iconId: UiIconId, stroke: string) {
  const iconSvg = renderUiIconSvg(iconId, stroke, 16) ?? renderUiIconSvg("map-pin", stroke, 16) ?? "";
  return iconSvg.replace("<svg ", '<svg x="10" y="10" ');
}

function buildMarkerIconUrl({ iconId, isActive, isVisited, openingState }: MarkerIconState) {
  const cacheKey = buildMarkerIconCacheKey({ iconId, isActive, isVisited, openingState });
  const cachedUrl = markerIconUrlCache.get(cacheKey);

  if (cachedUrl) {
    return cachedUrl;
  }

  const circleFill = isActive ? MARKER_ACTIVE_FILL : MARKER_DEFAULT_FILL;
  const circleStroke = isActive || isVisited ? MARKER_ACTIVE_STROKE : MARKER_DEFAULT_STROKE;
  const iconStroke = isActive ? ICON_ACTIVE_STROKE : ICON_DEFAULT_STROKE;

  const statusDot =
    openingState === null
      ? ""
      : `<circle cx="${STATUS_DOT_CX}" cy="${STATUS_DOT_CY}" r="${STATUS_DOT_RADIUS}" fill="${openingState === "open" ? "rgb(23 178 106)" : "rgb(163 163 163)"}" stroke="#ffffff" stroke-width="1.5" />`;

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${MARKER_SIZE}" height="${MARKER_SIZE}" viewBox="0 0 ${MARKER_SIZE} ${MARKER_SIZE}" aria-hidden="true">`,
    `<circle cx="${MARKER_CENTER}" cy="${MARKER_CENTER}" r="16.5" fill="${circleFill}" stroke="${circleStroke}" stroke-width="1.5" />`,
    buildNestedIconSvg(iconId, iconStroke),
    statusDot,
    "</svg>"
  ].join("");

  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  markerIconUrlCache.set(cacheKey, url);
  return url;
}

export function getGoogleMapsApiKey() {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
}

export function getGoogleMapsMapId() {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim() ?? "";
}

export function hasGoogleMapsApiKey() {
  return getGoogleMapsApiKey().length > 0;
}

export function loadGoogleMapsApi(): Promise<typeof google.maps> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser."));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return Promise.reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured."));
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise<typeof google.maps>((resolve, reject) => {
    const handleReady = () => {
      delete window[GOOGLE_MAPS_CALLBACK_NAME];

      if (!window.google?.maps) {
        googleMapsPromise = null;
        reject(new Error("Google Maps finished loading without exposing window.google.maps."));
        return;
      }

      resolve(window.google.maps);
    };

    window[GOOGLE_MAPS_CALLBACK_NAME] = handleReady;

    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener(
        "error",
        () => {
          googleMapsPromise = null;
          reject(new Error("Failed to load the Google Maps script."));
        },
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      delete window[GOOGLE_MAPS_CALLBACK_NAME];
      googleMapsPromise = null;
      reject(new Error("Failed to load the Google Maps script."));
    };
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&callback=${GOOGLE_MAPS_CALLBACK_NAME}`;

    document.head.append(script);
  });

  return googleMapsPromise;
}

// Cache for pre-rendered PNG markers
const markerPngCache = new Map<string, string>();

async function renderMarkerToPng(state: MarkerIconState): Promise<string> {
  const cacheKey = buildMarkerIconCacheKey(state) + ":png128";
  const cached = markerPngCache.get(cacheKey);
  if (cached) return cached;

  // Use 128x128 (power of 2) for better pixel alignment and less jitter
  const size = 128;
  const scale = size / MARKER_SIZE; // ~3.55x
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const center = size / 2;
  const circleFill = state.isActive ? MARKER_ACTIVE_FILL : MARKER_DEFAULT_FILL;
  const circleStroke = state.isActive || state.isVisited ? MARKER_ACTIVE_STROKE : MARKER_DEFAULT_STROKE;
  const iconStroke = state.isActive ? ICON_ACTIVE_STROKE : ICON_DEFAULT_STROKE;

  // Draw circle background (radius 33 * 3.55 ≈ 117, but use 58 for cleaner look)
  ctx.beginPath();
  ctx.arc(center, center, 58, 0, 2 * Math.PI);
  ctx.fillStyle = circleFill;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = circleStroke;
  ctx.stroke();

  // Draw icon (16px * 3.55 ≈ 57)
  const iconSize = 57;
  const iconSvg = renderUiIconSvg(state.iconId, iconStroke, iconSize) ?? renderUiIconSvg("map-pin", iconStroke, iconSize) ?? "";
  const iconX = (size - iconSize) / 2;
  const iconY = (size - iconSize) / 2;

  // Create image from SVG
  await new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, iconX, iconY, iconSize, iconSize);
      resolve();
    };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(iconSvg)}`;
  });

  // Draw status dot
  if (state.openingState !== null) {
    const dotX = size * 0.81; // ~104px
    const dotY = size * 0.19; // ~24px
    const dotRadius = STATUS_DOT_RADIUS * scale; // ~18px

    ctx.beginPath();
    ctx.arc(dotX, dotY, dotRadius, 0, 2 * Math.PI);
    ctx.fillStyle = state.openingState === "open" ? "rgb(23 178 106)" : "rgb(163 163 163)";
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
  }

  const pngUrl = canvas.toDataURL("image/png");
  markerPngCache.set(cacheKey, pngUrl);
  return pngUrl;
}

export async function createGoogleMarkerIconAsync(
  googleMaps: typeof google.maps,
  state: MarkerIconState
): Promise<google.maps.Icon> {
  const pngUrl = await renderMarkerToPng(state);
  return {
    anchor: new googleMaps.Point(MARKER_CENTER, MARKER_CENTER),
    scaledSize: new googleMaps.Size(MARKER_SIZE, MARKER_SIZE),
    url: pngUrl
  };
}

// Synchronous version (uses SVG, for initial render)
export function createGoogleMarkerIcon(
  googleMaps: typeof google.maps,
  state: MarkerIconState
): google.maps.Icon {
  return {
    anchor: new googleMaps.Point(MARKER_CENTER, MARKER_CENTER),
    scaledSize: new googleMaps.Size(MARKER_SIZE, MARKER_SIZE),
    url: buildMarkerIconUrl(state)
  };
}

// Create HTML element for AdvancedMarkerElement (modern API)
export function createAdvancedMarkerContent(state: MarkerIconState): HTMLElement {
  const circleFill = state.isActive ? MARKER_ACTIVE_FILL : MARKER_DEFAULT_FILL;
  const circleStroke = state.isActive || state.isVisited ? MARKER_ACTIVE_STROKE : MARKER_DEFAULT_STROKE;
  const iconStroke = state.isActive ? ICON_ACTIVE_STROKE : ICON_DEFAULT_STROKE;

  // Create container
  const container = document.createElement("div");
  container.style.width = `${MARKER_SIZE}px`;
  container.style.height = `${MARKER_SIZE}px`;
  container.style.position = "relative";
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.justifyContent = "center";

  // Create SVG content
  const iconSvg = renderUiIconSvg(state.iconId, iconStroke, 16) ?? renderUiIconSvg("map-pin", iconStroke, 16) ?? "";

  const statusDot = state.openingState === null
    ? ""
    : `<circle cx="${STATUS_DOT_CX}" cy="${STATUS_DOT_CY}" r="${STATUS_DOT_RADIUS}" fill="${state.openingState === "open" ? "rgb(23 178 106)" : "rgb(163 163 163)"}" stroke="#ffffff" stroke-width="1.5" />`;

  container.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${MARKER_SIZE}" height="${MARKER_SIZE}" viewBox="0 0 ${MARKER_SIZE} ${MARKER_SIZE}" style="display: block;">
      <circle cx="${MARKER_CENTER}" cy="${MARKER_CENTER}" r="16.5" fill="${circleFill}" stroke="${circleStroke}" stroke-width="1.5" />
      ${iconSvg.replace("<svg ", `<svg x="10" y="10" width="16" height="16" `)}
      ${statusDot}
    </svg>
  `;

  return container;
}
