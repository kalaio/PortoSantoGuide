import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const sections = [
  { slug: "where-to-eat", label: "Where to eat", sortOrder: 1 },
  { slug: "what-to-do", label: "What to do", sortOrder: 2 }
];

const schemas = [
  {
    slug: "food-place",
    label: "Food Place",
    description: "Dining venues such as restaurants, pizzerias, and snack-bars.",
    sortOrder: 1,
    fields: [
      { fieldKey: "description", sortOrder: 1, isRequired: true },
      { fieldKey: "location", sortOrder: 2, isRequired: false },
      { fieldKey: "openingHours", sortOrder: 3, isRequired: true, isFrontendFilterEnabled: true },
      { fieldKey: "cuisines", sortOrder: 4, isRequired: true, isFrontendFilterEnabled: true },
      { fieldKey: "priceLevel", sortOrder: 5, isRequired: false },
      { fieldKey: "priceFrom", sortOrder: 6, isRequired: false },
      { fieldKey: "takeaway", sortOrder: 7, isRequired: false }
    ]
  },
  {
    slug: "activity",
    label: "Activity",
    description: "Tours, experiences, and guided or unguided activities.",
    sortOrder: 2,
    fields: [
      { fieldKey: "description", sortOrder: 1, isRequired: true },
      { fieldKey: "durationMinutes", sortOrder: 2, isRequired: true },
      { fieldKey: "difficulty", sortOrder: 3, isRequired: false },
      { fieldKey: "priceFrom", sortOrder: 4, isRequired: false },
      { fieldKey: "bookingRequired", sortOrder: 5, isRequired: false }
    ]
  },
  {
    slug: "viewpoint",
    label: "Viewpoint",
    description: "Lookouts and scenic stops.",
    sortOrder: 3,
    fields: [
      { fieldKey: "description", sortOrder: 1, isRequired: true },
      { fieldKey: "location", sortOrder: 2, isRequired: false },
      { fieldKey: "accessType", sortOrder: 3, isRequired: true },
      { fieldKey: "bestTime", sortOrder: 4, isRequired: true },
      { fieldKey: "hikeMinutes", sortOrder: 5, isRequired: false },
      { fieldKey: "entryFee", sortOrder: 6, isRequired: false }
    ]
  },
  {
    slug: "generic",
    label: "Generic",
    description: "Fallback schema for simple records.",
    sortOrder: 4,
    fields: [{ fieldKey: "notes", sortOrder: 1, isRequired: false }]
  }
];

const categories = [
  {
    slug: "restaurants",
    label: "Restaurants",
    iconName: "restaurant",
    sectionSlug: "where-to-eat",
    schemaSlug: "food-place",
    sortOrder: 1
  },
  {
    slug: "pizzerias",
    label: "Pizzerias",
    iconName: "local_pizza",
    sectionSlug: "where-to-eat",
    schemaSlug: "food-place",
    sortOrder: 2
  },
  {
    slug: "snack-bars",
    label: "Snack-bars",
    iconName: "fastfood",
    sectionSlug: "where-to-eat",
    schemaSlug: "food-place",
    sortOrder: 3
  },
  {
    slug: "activities",
    label: "Activities",
    iconName: "hiking",
    sectionSlug: "what-to-do",
    schemaSlug: "activity",
    sortOrder: 1
  },
  {
    slug: "viewpoints",
    label: "Viewpoints",
    iconName: "travel_explore",
    sectionSlug: "what-to-do",
    schemaSlug: "viewpoint",
    sortOrder: 2
  }
];

const listings = [
  {
    slug: "casa-da-praia",
    title: "Casa da Praia",
    description: "Seafood-focused restaurant by the beach with sunset tables and local fish dishes.",
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
    primaryCategorySlug: "restaurants",
    categorySlugs: ["restaurants", "snack-bars"]
  },
  {
    slug: "pizzaria-ilheu",
    title: "Pizzaria Ilheu",
    description: "Family pizzeria with wood-fired oven, quick service, and takeaway options.",
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
    primaryCategorySlug: "pizzerias",
    categorySlugs: ["pizzerias", "restaurants"]
  },
  {
    slug: "porto-santo-jeep-tour",
    title: "Porto Santo Jeep Tour",
    description: "Guided off-road route around hidden beaches, dunes, and local viewpoints.",
    latitude: 33.0838,
    longitude: -16.3023,
    rating: 4.9,
    details: {
      durationMinutes: 180,
      difficulty: "easy",
      bookingRequired: true,
      priceFrom: 42
    },
    primaryCategorySlug: "activities",
    categorySlugs: ["activities"]
  },
  {
    slug: "miradouro-das-flores",
    title: "Miradouro das Flores",
    description: "Panoramic viewpoint with wide island views and a short walking trail.",
    latitude: 33.1104,
    longitude: -16.2927,
    rating: 4.6,
    details: {
      accessType: "car",
      bestTime: "sunset",
      hikeMinutes: 10,
      entryFee: 0
    },
    primaryCategorySlug: "viewpoints",
    categorySlugs: ["viewpoints", "activities"]
  }
];

const suggestions = [
  { label: "Restaurants in Porto Santo", query: "restaurant", priority: 100 },
  { label: "Best pizzerias", query: "pizza", priority: 90 },
  { label: "Outdoor activities", query: "activity", priority: 80 },
  { label: "Island viewpoints", query: "viewpoint", priority: 70 }
];

function ensurePrimaryCategoryIncluded(primaryCategorySlug, categorySlugs) {
  const values = new Set(categorySlugs);
  values.add(primaryCategorySlug);
  return [...values];
}

function getCategoryBySlug(categoryMap, slug) {
  const category = categoryMap.get(slug);
  if (!category) {
    throw new Error(`Unknown category slug: ${slug}`);
  }

  return category;
}

async function ensureListingCurrentRevisions() {
  const listings = await prisma.listing.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      status: true,
      latitude: true,
      longitude: true,
      details: true,
      primaryCategoryId: true,
      ownerId: true,
      currentPublishedRevisionId: true,
      currentDraftRevisionId: true,
      categories: {
        select: {
          categoryId: true
        }
      }
    }
  });

  for (const listing of listings) {
    if ((listing.status === "PUBLISHED" || listing.status === "ARCHIVED") && !listing.currentPublishedRevisionId) {
      const publishedRevision = await prisma.listingRevision.create({
        data: {
          listingId: listing.id,
          slug: listing.slug,
          title: listing.title,
          description: listing.description,
          status: "PUBLISHED",
          latitude: listing.latitude,
          longitude: listing.longitude,
          details: listing.details,
          primaryCategoryId: listing.primaryCategoryId,
          createdById: listing.ownerId,
          updatedById: listing.ownerId,
          categories: {
            create: listing.categories.map((item) => ({
              categoryId: item.categoryId
            }))
          }
        },
        select: {
          id: true
        }
      });

      await prisma.listing.update({
        where: { id: listing.id },
        data: {
          currentPublishedRevisionId: publishedRevision.id
        }
      });
    }

    if (listing.status === "DRAFT" && !listing.currentDraftRevisionId) {
      const draftRevision = await prisma.listingRevision.create({
        data: {
          listingId: listing.id,
          slug: listing.slug,
          title: listing.title,
          description: listing.description,
          status: "DRAFT",
          latitude: listing.latitude,
          longitude: listing.longitude,
          details: listing.details,
          primaryCategoryId: listing.primaryCategoryId,
          createdById: listing.ownerId,
          updatedById: listing.ownerId,
          categories: {
            create: listing.categories.map((item) => ({
              categoryId: item.categoryId
            }))
          }
        },
        select: {
          id: true
        }
      });

      await prisma.listing.update({
        where: { id: listing.id },
        data: {
          currentDraftRevisionId: draftRevision.id
        }
      });
    }
  }
}

async function main() {
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const ownerPasswordHash = await bcrypt.hash("owner123", 10);
  const subscriberPasswordHash = await bcrypt.hash("subscriber123", 10);

  const administrator = await prisma.user.upsert({
    where: { username: "administrator" },
    update: {
      email: "administrator@portosantoguide.local",
      role: "ADMINISTRATOR",
      isActive: true,
      passwordHash: adminPasswordHash
    },
    create: {
      username: "administrator",
      email: "administrator@portosantoguide.local",
      role: "ADMINISTRATOR",
      isActive: true,
      passwordHash: adminPasswordHash
    }
  });

  const owner = await prisma.user.upsert({
    where: { username: "owner" },
    update: {
      email: "owner@portosantoguide.local",
      role: "OWNER",
      isActive: true,
      passwordHash: ownerPasswordHash
    },
    create: {
      username: "owner",
      email: "owner@portosantoguide.local",
      role: "OWNER",
      isActive: true,
      passwordHash: ownerPasswordHash
    }
  });

  await prisma.user.upsert({
    where: { username: "subscriber" },
    update: {
      email: "subscriber@portosantoguide.local",
      role: "SUBSCRIBER",
      isActive: true,
      passwordHash: subscriberPasswordHash
    },
    create: {
      username: "subscriber",
      email: "subscriber@portosantoguide.local",
      role: "SUBSCRIBER",
      isActive: true,
      passwordHash: subscriberPasswordHash
    }
  });

  const sectionMap = new Map();

  for (const section of sections) {
    const upsertedSection = await prisma.directorySection.upsert({
      where: { slug: section.slug },
      update: {
        label: section.label,
        sortOrder: section.sortOrder,
        isActive: true
      },
      create: {
        slug: section.slug,
        label: section.label,
        sortOrder: section.sortOrder,
        isActive: true
      }
    });

    sectionMap.set(section.slug, upsertedSection.id);
  }

  const schemaMap = new Map();

  for (const schema of schemas) {
    const upsertedSchema = await prisma.listingSchema.upsert({
      where: { slug: schema.slug },
      update: {
        label: schema.label,
        description: schema.description,
        sortOrder: schema.sortOrder,
        isActive: true
      },
      create: {
        slug: schema.slug,
        label: schema.label,
        description: schema.description,
        sortOrder: schema.sortOrder,
        isActive: true
      }
    });

    await prisma.listingSchemaField.deleteMany({
      where: { schemaId: upsertedSchema.id }
    });

    await prisma.listingSchemaField.createMany({
      data: schema.fields.map((field) => ({
        schemaId: upsertedSchema.id,
        fieldKey: field.fieldKey,
        sortOrder: field.sortOrder,
        isRequired: field.isRequired,
        isFrontendFilterEnabled: field.isFrontendFilterEnabled ?? false
      }))
    });

    schemaMap.set(schema.slug, upsertedSchema);
  }

  const categoryMap = new Map();

  for (const category of categories) {
    const sectionId = sectionMap.get(category.sectionSlug);
    if (!sectionId) {
      throw new Error(`Unknown section slug: ${category.sectionSlug}`);
    }

    const schema = schemaMap.get(category.schemaSlug);
    if (!schema) {
      throw new Error(`Unknown schema slug: ${category.schemaSlug}`);
    }

    const upsertedCategory = await prisma.listingCategory.upsert({
      where: { slug: category.slug },
      update: {
        label: category.label,
        iconName: category.iconName,
        sectionId,
        schemaId: schema.id,
        sortOrder: category.sortOrder,
        isActive: true
      },
      create: {
        slug: category.slug,
        label: category.label,
        iconName: category.iconName,
        sectionId,
        schemaId: schema.id,
        sortOrder: category.sortOrder,
        isActive: true
      }
    });

    categoryMap.set(category.slug, {
      id: upsertedCategory.id,
      sectionId
    });
  }

  for (const listing of listings) {
    const primaryCategory = getCategoryBySlug(categoryMap, listing.primaryCategorySlug);

    const assignmentSlugs = ensurePrimaryCategoryIncluded(
      listing.primaryCategorySlug,
      listing.categorySlugs
    );

    const assignmentCategoryIds = assignmentSlugs.map((slug) => getCategoryBySlug(categoryMap, slug).id);

    const upsertedListing = await prisma.listing.upsert({
      where: { slug: listing.slug },
      update: {
        slug: listing.slug,
        title: listing.title,
        description: listing.description,
        latitude: listing.latitude,
        longitude: listing.longitude,
        rating: listing.rating,
        status: "PUBLISHED",
        details: listing.details,
        primaryCategoryId: primaryCategory.id,
        ownerId: owner.id
      },
      create: {
        slug: listing.slug,
        title: listing.title,
        description: listing.description,
        latitude: listing.latitude,
        longitude: listing.longitude,
        rating: listing.rating,
        status: "PUBLISHED",
        details: listing.details,
        primaryCategoryId: primaryCategory.id,
        ownerId: owner.id
      }
    });

    await prisma.listingCategoryAssignment.deleteMany({
      where: { listingId: upsertedListing.id }
    });

    await prisma.listingCategoryAssignment.createMany({
      data: assignmentCategoryIds.map((categoryId) => ({
        listingId: upsertedListing.id,
        categoryId
      }))
    });
  }

  const adminPrimaryCategory = getCategoryBySlug(categoryMap, "viewpoints");

  const adminListing = await prisma.listing.upsert({
    where: { slug: "sunset-ridge-viewpoint" },
    update: {
      title: "Sunset Ridge Viewpoint",
      description: "High-elevation stop with sunset views over the Atlantic coast.",
      latitude: 33.0971,
      longitude: -16.3104,
      rating: 4.8,
      status: "PUBLISHED",
      details: {
        accessType: "car",
        bestTime: "sunset",
        hikeMinutes: 8,
        entryFee: 0
      },
      primaryCategoryId: adminPrimaryCategory.id,
      ownerId: administrator.id
    },
    create: {
      slug: "sunset-ridge-viewpoint",
      title: "Sunset Ridge Viewpoint",
      description: "High-elevation stop with sunset views over the Atlantic coast.",
      latitude: 33.0971,
      longitude: -16.3104,
      rating: 4.8,
      status: "PUBLISHED",
      details: {
        accessType: "car",
        bestTime: "sunset",
        hikeMinutes: 8,
        entryFee: 0
      },
      primaryCategoryId: adminPrimaryCategory.id,
      ownerId: administrator.id
    }
  });

  const adminCategoryIds = ["viewpoints", "activities"].map((slug) => getCategoryBySlug(categoryMap, slug).id);

  await prisma.listingCategoryAssignment.deleteMany({
    where: { listingId: adminListing.id }
  });

  await prisma.listingCategoryAssignment.createMany({
    data: adminCategoryIds.map((categoryId) => ({
      listingId: adminListing.id,
      categoryId
    }))
  });

  for (const suggestion of suggestions) {
    const suggestionId = suggestion.label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    await prisma.searchSuggestion.upsert({
      where: { id: suggestionId },
      update: suggestion,
      create: {
        id: suggestionId,
        ...suggestion,
        isActive: true
      }
    });
  }

  await prisma.slider.upsert({
    where: { slug: "homepage" },
    update: {
      name: "Homepage",
      isActive: true
    },
    create: {
      name: "Homepage",
      slug: "homepage",
      isActive: true
    }
  });

  await ensureListingCurrentRevisions();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
