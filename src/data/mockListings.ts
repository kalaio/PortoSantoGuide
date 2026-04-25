import type { Listing } from "@/types/listing";

export const mockListings: Listing[] = [
  {
    id: "casa-da-praia",
    slug: "casa-da-praia",
    title: "Casa da Praia",
    status: "PUBLISHED",
    latitude: 33.0646,
    longitude: -16.3476,
    rating: 4.8,
    details: {
      cuisines: ["local-madeiran", "seafood"],
      openingHoursWeek: {
        sunday: [
          { open: "11:00", close: "15:00" },
          { open: "18:00", close: "00:00" }
        ],
        monday: [],
        tuesday: [{ open: "11:00", close: "00:00" }],
        wednesday: [{ open: "11:00", close: "00:00" }],
        thursday: [{ open: "11:00", close: "00:00" }],
        friday: [{ open: "11:00", close: "00:00" }],
        saturday: [{ open: "11:00", close: "00:00" }]
      },
      takeaway: false,
      priceLevel: "mid",
      priceFrom: 24
    },
    primaryCategory: {
      slug: "restaurants",
      label: "Restaurants",
      iconName: "fork-knife",
      sectionSlug: "where-to-eat",
      sectionLabel: "Where to eat",
      schema: {
        slug: "food-place",
        label: "Food Place",
        fields: [
          { fieldKey: "description", sortOrder: 1, isRequired: true, isFrontendFilterEnabled: false },
          { fieldKey: "location", sortOrder: 2, isRequired: false, isFrontendFilterEnabled: false },
          { fieldKey: "openingHours", sortOrder: 3, isRequired: true, isFrontendFilterEnabled: true },
          { fieldKey: "cuisines", sortOrder: 4, isRequired: true, isFrontendFilterEnabled: true },
          { fieldKey: "priceLevel", sortOrder: 5, isRequired: false, isFrontendFilterEnabled: false },
          { fieldKey: "priceFrom", sortOrder: 6, isRequired: false, isFrontendFilterEnabled: false },
          { fieldKey: "takeaway", sortOrder: 7, isRequired: false, isFrontendFilterEnabled: false }
        ],
        photoSections: []
      }
    },
    categories: [
      { slug: "restaurants", label: "Restaurants" },
      { slug: "snack-bars", label: "Snack-bars" }
    ],
    coverPhoto: null,
    photos: []
  },
  {
    id: "pizzaria-ilheu",
    slug: "pizzaria-ilheu",
    title: "Pizzaria Ilheu",
    status: "PUBLISHED",
    latitude: 33.0712,
    longitude: -16.3408,
    rating: 4.7,
    details: {
      cuisines: ["pizza", "italian"],
      openingHoursWeek: {
        sunday: [{ open: "18:00", close: "23:30" }],
        monday: [],
        tuesday: [{ open: "18:00", close: "23:30" }],
        wednesday: [{ open: "18:00", close: "23:30" }],
        thursday: [{ open: "18:00", close: "23:30" }],
        friday: [{ open: "18:00", close: "00:30" }],
        saturday: [{ open: "18:00", close: "00:30" }]
      },
      takeaway: true,
      priceLevel: "budget",
      priceFrom: 18
    },
    primaryCategory: {
      slug: "pizzerias",
      label: "Pizzerias",
      iconName: "pizza",
      sectionSlug: "where-to-eat",
      sectionLabel: "Where to eat",
      schema: {
        slug: "food-place",
        label: "Food Place",
        fields: [
          { fieldKey: "description", sortOrder: 1, isRequired: true, isFrontendFilterEnabled: false },
          { fieldKey: "location", sortOrder: 2, isRequired: false, isFrontendFilterEnabled: false },
          { fieldKey: "openingHours", sortOrder: 3, isRequired: true, isFrontendFilterEnabled: true },
          { fieldKey: "cuisines", sortOrder: 4, isRequired: true, isFrontendFilterEnabled: true },
          { fieldKey: "priceLevel", sortOrder: 5, isRequired: false, isFrontendFilterEnabled: false },
          { fieldKey: "priceFrom", sortOrder: 6, isRequired: false, isFrontendFilterEnabled: false },
          { fieldKey: "takeaway", sortOrder: 7, isRequired: false, isFrontendFilterEnabled: false }
        ],
        photoSections: []
      }
    },
    categories: [
      { slug: "pizzerias", label: "Pizzerias" },
      { slug: "restaurants", label: "Restaurants" }
    ],
    coverPhoto: null,
    photos: []
  },
  {
    id: "porto-santo-jeep-tour",
    slug: "porto-santo-jeep-tour",
    title: "Porto Santo Jeep Tour",
    status: "PUBLISHED",
    latitude: 33.0838,
    longitude: -16.3023,
    rating: 4.9,
    details: {
      durationMinutes: 180,
      difficulty: "easy",
      bookingRequired: true,
      priceFrom: 42
    },
    primaryCategory: {
      slug: "activities",
      label: "Activities",
      iconName: "compass",
      sectionSlug: "what-to-do",
      sectionLabel: "What to do",
      schema: {
        slug: "activity",
        label: "Activity",
        fields: [
          { fieldKey: "description", sortOrder: 1, isRequired: true, isFrontendFilterEnabled: false },
          { fieldKey: "durationMinutes", sortOrder: 2, isRequired: true, isFrontendFilterEnabled: false },
          { fieldKey: "difficulty", sortOrder: 3, isRequired: false, isFrontendFilterEnabled: false },
          { fieldKey: "priceFrom", sortOrder: 4, isRequired: false, isFrontendFilterEnabled: false },
          { fieldKey: "bookingRequired", sortOrder: 5, isRequired: false, isFrontendFilterEnabled: false }
        ],
        photoSections: []
      }
    },
    categories: [{ slug: "activities", label: "Activities" }],
    coverPhoto: null,
    photos: []
  }
];
