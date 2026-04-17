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
