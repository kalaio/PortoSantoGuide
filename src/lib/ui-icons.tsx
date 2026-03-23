import type { ComponentType, SVGProps } from "react";
import {
  ArrowLeft,
  Building05,
  Compass,
  Eye,
  MarkerPin01,
  Menu02,
  PieChart01,
  SearchMd,
  ShoppingBag01,
  XClose
} from "@untitledui/icons";

export const UI_ICON_IDS = [
  "bakery",
  "back",
  "bar",
  "close",
  "compass",
  "fork-knife",
  "map-pin",
  "menu",
  "pizza",
  "search",
  "snack-bar",
  "viewpoint"
] as const;

export type UiIconId = (typeof UI_ICON_IDS)[number];

type UiIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const UI_ICON_COMPONENTS: Record<UiIconId, UiIconComponent> = {
  bakery: PieChart01,
  back: ArrowLeft,
  bar: ShoppingBag01,
  close: XClose,
  compass: Compass,
  "fork-knife": Building05,
  "map-pin": MarkerPin01,
  menu: Menu02,
  pizza: PieChart01,
  search: SearchMd,
  "snack-bar": ShoppingBag01,
  viewpoint: Eye
};

const LEGACY_UI_ICON_NAME_MAP: Record<string, UiIconId> = {
  fastfood: "snack-bar",
  hiking: "compass",
  "local_pizza": "pizza",
  restaurant: "fork-knife",
  travel_explore: "viewpoint"
};

export const CATEGORY_UI_ICON_OPTIONS: Array<{ value: UiIconId; label: string }> = [
  { value: "bar", label: "Bars" },
  { value: "bakery", label: "Bakeries" },
  { value: "fork-knife", label: "Restaurants / dining" },
  { value: "pizza", label: "Pizza" },
  { value: "snack-bar", label: "Snack-bars / takeaway" },
  { value: "compass", label: "Activities / outdoors" },
  { value: "viewpoint", label: "Viewpoints / scenic stops" },
  { value: "map-pin", label: "Places / location" }
];

const CATEGORY_ICON_FALLBACKS: Record<string, UiIconId> = {
  activities: "compass",
  bakeries: "bakery",
  bars: "bar",
  pizzerias: "pizza",
  restaurants: "fork-knife",
  "snack-bars": "snack-bar",
  viewpoints: "viewpoint"
};

const UI_ICON_SVG_PATHS: Record<UiIconId, string[]> = {
  bakery: [
    "M21.21 15.89A10 10 0 1 1 8 2.83",
    "M21.24 8.173a10 10 0 0 1 .728 3.028c.021.257.031.385-.02.5a.525.525 0 0 1-.22.239c-.11.06-.25.06-.528.06h-8.4c-.28 0-.42 0-.527-.055a.5.5 0 0 1-.218-.218C12 11.62 12 11.48 12 11.2V2.8c0-.278 0-.417.06-.528a.525.525 0 0 1 .239-.22c.115-.05.244-.04.5-.02a10 10 0 0 1 8.44 6.141Z"
  ],
  back: ["m4 12 7-7m-7 7 7 7m-7-7h16"],
  bar: [
    "M5.52 2.64 3.96 4.72c-.309.412-.463.618-.46.79a.5.5 0 0 0 .192.384C3.828 6 4.085 6 4.6 6h14.8c.515 0 .773 0 .908-.106a.5.5 0 0 0 .192-.384c.003-.172-.151-.378-.46-.79l-1.56-2.08",
    "M5.52 2.64c.176-.235.264-.352.376-.437a1 1 0 0 1 .33-.165C6.36 2 6.505 2 6.8 2h10.4c.293 0 .44 0 .575.038a1 1 0 0 1 .33.165c.111.085.199.202.375.437",
    "M5.52 2.64 3.64 5.147c-.237.316-.356.475-.44.649a2 2 0 0 0-.163.487C3 6.473 3 6.671 3 7.067V18.8c0 1.12 0 1.68.218 2.108a2 2 0 0 0 .874.874C4.52 22 5.08 22 6.2 22h11.6c1.12 0 1.68 0 2.108-.218a2 2 0 0 0 .874-.874C21 20.48 21 19.92 21 18.8V7.067c0-.396 0-.594-.037-.784a1.998 1.998 0 0 0-.163-.487c-.084-.174-.203-.333-.44-.65L18.48 2.64",
    "M16 10a4 4 0 1 1-8 0"
  ],
  close: ["M18 6 6 18M6 6l12 12"],
  compass: [
    "M12 4a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z",
    "M12 4V2",
    "M21 14.938A11.971 11.971 0 0 1 12 19a11.971 11.971 0 0 1-9-4.063",
    "m10.745 8.663-7.745 13.337",
    "M13.255 8.662 21 22"
  ],
  "fork-knife": [
    "M13 11h4.8c1.12 0 1.68 0 2.108.218a2 2 0 0 1 .874.874C21 12.52 21 13.08 21 14.2V21",
    "M13 21V6.2c0-1.12 0-1.68-.218-2.108a2 2 0 0 0-.874-.874C11.48 3 10.92 3 9.8 3H6.2c-1.12 0-1.68 0-2.108.218a2 2 0 0 0-.874.874C3 4.52 3 5.08 3 6.2V21",
    "M22 21H2",
    "M6.5 7h3",
    "M6.5 11h3",
    "M6.5 15h3"
  ],
  "map-pin": ["M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z", "M12 22c4-4 8-7.582 8-12a8 8 0 1 0-16 0c0 4.418 4 8 8 12Z"],
  menu: ["M3 12h12", "M3 6h18", "M3 18h18"],
  pizza: [
    "M21.21 15.89A10 10 0 1 1 8 2.83",
    "M21.24 8.173a10 10 0 0 1 .728 3.028c.021.257.031.385-.02.5a.525.525 0 0 1-.22.239c-.11.06-.25.06-.528.06h-8.4c-.28 0-.42 0-.527-.055a.5.5 0 0 1-.218-.218C12 11.62 12 11.48 12 11.2V2.8c0-.278 0-.417.06-.528a.525.525 0 0 1 .239-.22c.115-.05.244-.04.5-.02a10 10 0 0 1 8.44 6.141Z"
  ],
  search: ["m21 21-4.35-4.35", "a7.65 7.65 0 1 1 0-10.82 7.65 7.65 0 0 1 0 10.82Z"],
  "snack-bar": [
    "M5.52 2.64 3.96 4.72c-.309.412-.463.618-.46.79a.5.5 0 0 0 .192.384C3.828 6 4.085 6 4.6 6h14.8c.515 0 .773 0 .908-.106a.5.5 0 0 0 .192-.384c.003-.172-.151-.378-.46-.79l-1.56-2.08",
    "M5.52 2.64c.176-.235.264-.352.376-.437a1 1 0 0 1 .33-.165C6.36 2 6.505 2 6.8 2h10.4c.293 0 .44 0 .575.038a1 1 0 0 1 .33.165c.111.085.199.202.375.437",
    "M5.52 2.64 3.64 5.147c-.237.316-.356.475-.44.649a2 2 0 0 0-.163.487C3 6.473 3 6.671 3 7.067V18.8c0 1.12 0 1.68.218 2.108a2 2 0 0 0 .874.874C4.52 22 5.08 22 6.2 22h11.6c1.12 0 1.68 0 2.108-.218a2 2 0 0 0 .874-.874C21 20.48 21 19.92 21 18.8V7.067c0-.396 0-.594-.037-.784a1.998 1.998 0 0 0-.163-.487c-.084-.174-.203-.333-.44-.65L18.48 2.64",
    "M16 10a4 4 0 1 1-8 0"
  ],
  viewpoint: [
    "M2.42 12.713c-.136-.215-.204-.323-.242-.49a1.173 1.173 0 0 1 0-.446c.038-.167.106-.274.242-.49C3.546 9.505 6.895 5 12 5s8.455 4.505 9.58 6.287c.137.215.205.323.243.49.029.125.029.322 0 .446-.038.167-.106.274-.242.49C20.455 14.495 17.105 19 12 19c-5.106 0-8.455-4.505-9.58-6.287Z",
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
  ]
};

export function normalizeUiIconName(value: string | null | undefined): UiIconId | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized in UI_ICON_COMPONENTS) {
    return normalized as UiIconId;
  }

  return LEGACY_UI_ICON_NAME_MAP[normalized] ?? null;
}

export function getUiIconComponent(iconName: string | null | undefined): UiIconComponent | null {
  const normalized = normalizeUiIconName(iconName);
  if (!normalized) {
    return null;
  }

  return UI_ICON_COMPONENTS[normalized];
}

export function renderUiIcon(
  iconName: string | null | undefined,
  props: SVGProps<SVGSVGElement> = {}
) {
  const normalized = normalizeUiIconName(iconName);
  if (!normalized) {
    return null;
  }

  switch (normalized) {
    case "bakery":
      return <PieChart01 aria-hidden="true" {...props} />;
    case "back":
      return <ArrowLeft aria-hidden="true" {...props} />;
    case "bar":
      return <ShoppingBag01 aria-hidden="true" {...props} />;
    case "close":
      return <XClose aria-hidden="true" {...props} />;
    case "compass":
      return <Compass aria-hidden="true" {...props} />;
    case "fork-knife":
      return <Building05 aria-hidden="true" {...props} />;
    case "map-pin":
      return <MarkerPin01 aria-hidden="true" {...props} />;
    case "menu":
      return <Menu02 aria-hidden="true" {...props} />;
    case "pizza":
      return <PieChart01 aria-hidden="true" {...props} />;
    case "search":
      return <SearchMd aria-hidden="true" {...props} />;
    case "snack-bar":
      return <ShoppingBag01 aria-hidden="true" {...props} />;
    case "viewpoint":
      return <Eye aria-hidden="true" {...props} />;
    default:
      return null;
  }
}

export function getCategoryFallbackIconName(slug: string): UiIconId | null {
  return CATEGORY_ICON_FALLBACKS[slug] ?? null;
}

export function getUiIconOptionsForCategories() {
  return CATEGORY_UI_ICON_OPTIONS;
}

export function renderUiIconSvg(iconName: string | null | undefined, stroke = "currentColor"): string | null {
  const normalized = normalizeUiIconName(iconName);
  if (!normalized) {
    return null;
  }

  const paths = UI_ICON_SVG_PATHS[normalized]
    .map((path) => `<path d="${path}" />`)
    .join("");

  return `<svg viewBox="0 0 24 24" width="24" height="24" stroke="${stroke}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}
