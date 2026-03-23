import { ListingStatus, Prisma } from "@prisma/client";
import { mockListings } from "@/data/mockListings";
import { prisma } from "@/lib/prisma";
import { getCategoryFallbackIconName, normalizeUiIconName } from "@/lib/ui-icons";
import type {
  Listing,
  ListingCategorySummary,
  ListingCategoryTag,
  ListingDetail
} from "@/types/listing";
import { toListingDetails } from "@/lib/listing-details";

export type SectionCategorySummary = {
  slug: string;
  label: string;
  iconName: ListingCategorySummary["iconName"];
  listingCount: number;
};

export type DirectorySectionSummary = {
  slug: string;
  label: string;
  categories: SectionCategorySummary[];
};

export type PublicMenuLink = {
  href: string;
  label: string;
};

const publishedRevisionFieldOrderBy: Prisma.ListingSchemaFieldOrderByWithRelationInput[] = [
  { sortOrder: "asc" },
  { fieldKey: "asc" }
];

const listingWithRelations = Prisma.validator<Prisma.ListingDefaultArgs>()({
  include: {
    currentPublishedRevision: {
      include: {
        primaryCategory: {
          include: {
            section: true,
            schema: {
              include: {
                fields: {
                  orderBy: publishedRevisionFieldOrderBy
                }
              }
            }
          }
        },
        categories: {
          include: {
            category: true
          }
        }
      }
    }
  }
});

type ListingWithPublishedRevision = Prisma.ListingGetPayload<typeof listingWithRelations>;

type PublishedRevision = NonNullable<ListingWithPublishedRevision["currentPublishedRevision"]>;

const PUBLIC_LISTING_STATUS = ListingStatus.PUBLISHED;

function getPublishedRevision(item: ListingWithPublishedRevision): PublishedRevision {
  if (!item.currentPublishedRevision) {
    throw new Error("Listing missing currentPublishedRevision");
  }

  return item.currentPublishedRevision;
}

function buildFallbackPublicMenuLinks(): PublicMenuLink[] {
  const sectionLinks = new Map<string, PublicMenuLink>();
  const categoryLinks = new Map<string, PublicMenuLink>();

  mockListings.forEach((listing) => {
    sectionLinks.set(listing.primaryCategory.sectionSlug, {
      href: `/${listing.primaryCategory.sectionSlug}`,
      label: listing.primaryCategory.sectionLabel
    });

    listing.categories.forEach((category) => {
      if (!categoryLinks.has(category.slug)) {
        categoryLinks.set(category.slug, {
          href: `/${category.slug}`,
          label: category.label
        });
      }
    });
  });

  return [...sectionLinks.values(), ...categoryLinks.values()];
}

function toPrimaryCategory(item: ListingWithPublishedRevision): ListingCategorySummary {
  const revision = getPublishedRevision(item);

  return {
    slug: revision.primaryCategory.slug,
    label: revision.primaryCategory.label,
    iconName: normalizeUiIconName(revision.primaryCategory.iconName),
    sectionSlug: revision.primaryCategory.section.slug,
    sectionLabel: revision.primaryCategory.section.label,
    schema: revision.primaryCategory.schema
      ? {
          slug: revision.primaryCategory.schema.slug,
          label: revision.primaryCategory.schema.label,
          fields: revision.primaryCategory.schema.fields.map((field) => ({
            fieldKey: field.fieldKey,
            sortOrder: field.sortOrder,
            isRequired: field.isRequired,
            isFrontendFilterEnabled: field.isFrontendFilterEnabled
          }))
        }
      : null
  };
}

function toCategoryTags(item: ListingWithPublishedRevision): ListingCategoryTag[] {
  const revision = getPublishedRevision(item);
  const unique = new Map<string, string>();

  revision.categories.forEach(({ category }) => {
    unique.set(category.slug, category.label);
  });
  unique.set(revision.primaryCategory.slug, revision.primaryCategory.label);

  return [...unique.entries()].map(([slug, label]) => ({ slug, label }));
}

function toListingCard(item: ListingWithPublishedRevision): Listing {
  const revision = getPublishedRevision(item);

  return {
    id: item.id,
    slug: revision.slug,
    title: revision.title,
    status: item.status,
    latitude: revision.latitude,
    longitude: revision.longitude,
    rating: item.rating,
    details: toListingDetails(revision.details),
    primaryCategory: toPrimaryCategory(item),
    categories: toCategoryTags(item)
  };
}

function toListingDetail(item: ListingWithPublishedRevision): ListingDetail {
  const revision = getPublishedRevision(item);

  return {
    ...toListingCard(item),
    description: revision.description
  };
}

function toFallbackListingDetail(mock: Listing): ListingDetail {
  return {
    ...mock,
    description: "A curated Porto Santo spot with practical details and local highlights."
  };
}

export async function getFeaturedListings(): Promise<Listing[]> {
  if (!process.env.DATABASE_URL) {
    return mockListings;
  }

  try {
    const listings = await prisma.listing.findMany({
      where: {
        status: PUBLIC_LISTING_STATUS,
        currentPublishedRevisionId: {
          not: null
        },
        primaryCategory: {
          isActive: true,
          section: {
            isActive: true
          }
        }
      },
      orderBy: [{ createdAt: "desc" }],
      take: 24,
      ...listingWithRelations
    });

    if (listings.length === 0) {
      return mockListings;
    }

    return listings.map(toListingCard);
  } catch {
    return mockListings;
  }
}

export async function getPublicMenuLinks(): Promise<PublicMenuLink[]> {
  if (!process.env.DATABASE_URL) {
    return buildFallbackPublicMenuLinks();
  }

  try {
    const sections = await prisma.directorySection.findMany({
      where: {
        isActive: true
      },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      select: {
        slug: true,
        label: true,
        categories: {
          where: {
            isActive: true,
            assignments: {
              some: {
                listing: {
                  status: PUBLIC_LISTING_STATUS
                }
              }
            }
          },
          orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
          select: {
            slug: true,
            label: true
          }
        }
      }
    });

    if (sections.length === 0) {
      return buildFallbackPublicMenuLinks();
    }

    return sections.flatMap((section) =>
      section.categories.length > 0
        ? [
            {
              href: `/${section.slug}`,
              label: section.label
            },
            ...section.categories.map((category) => ({
              href: `/${category.slug}`,
              label: category.label
            }))
          ]
        : []
    );
  } catch {
    return buildFallbackPublicMenuLinks();
  }
}

export async function getSectionSummaryBySlug(slug: string): Promise<DirectorySectionSummary | null> {
  if (!process.env.DATABASE_URL) {
    const mockForSection = mockListings.filter((item) => item.primaryCategory.sectionSlug === slug);
    if (mockForSection.length === 0) {
      return null;
    }

    const categories = new Map<string, SectionCategorySummary>();

    mockForSection.forEach((listing) => {
      listing.categories.forEach((category) => {
        const current = categories.get(category.slug);
        categories.set(category.slug, {
          slug: category.slug,
          label: category.label,
          iconName: getCategoryFallbackIconName(category.slug),
          listingCount: (current?.listingCount ?? 0) + 1
        });
      });
    });

    return {
      slug,
      label: mockForSection[0].primaryCategory.sectionLabel,
      categories: [...categories.values()]
    };
  }

  try {
    const section = await prisma.directorySection.findFirst({
      where: {
        slug,
        isActive: true
      },
      select: {
        slug: true,
        label: true
      }
    });

    if (!section) {
      return null;
    }

    const categories = await prisma.listingCategory.findMany({
      where: {
        section: {
          slug: section.slug
        },
        isActive: true,
        assignments: {
          some: {
            listing: {
              status: PUBLIC_LISTING_STATUS
            }
          }
        }
      },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      select: {
        slug: true,
        label: true,
        iconName: true,
        assignments: {
          where: {
            listing: {
              status: PUBLIC_LISTING_STATUS
            }
          },
          select: {
            listingId: true
          }
        }
      }
    });

    if (categories.length === 0) {
      return null;
    }

    return {
      slug: section.slug,
      label: section.label,
      categories: categories.map((item) => ({
        slug: item.slug,
        label: item.label,
        iconName: normalizeUiIconName(item.iconName),
        listingCount: item.assignments.length
      }))
    };
  } catch {
    return null;
  }
}

export async function getListingsByCategorySlug(
  categorySlug: string
): Promise<{
  category: ListingCategorySummary | null;
  listings: Listing[];
}> {
  if (!process.env.DATABASE_URL) {
    const listings = mockListings.filter((listing) => listing.categories.some((category) => category.slug === categorySlug));

    const categoryLabel =
      listings
        .flatMap((listing) => listing.categories)
        .find((category) => category.slug === categorySlug)?.label ?? categorySlug;

    const primaryForSection = listings[0]?.primaryCategory;

    return {
      category: primaryForSection
        ? {
            slug: categorySlug,
            label: categoryLabel,
            iconName: normalizeUiIconName(primaryForSection.iconName),
            sectionSlug: primaryForSection.sectionSlug,
            sectionLabel: primaryForSection.sectionLabel,
            schema: primaryForSection.schema
          }
        : null,
      listings
    };
  }

  try {
    const category = await prisma.listingCategory.findFirst({
      where: {
        slug: categorySlug,
        isActive: true,
        section: {
          isActive: true
        }
      },
      select: {
        slug: true,
        label: true,
        iconName: true,
        schema: {
          select: {
            slug: true,
            label: true,
            fields: {
              orderBy: [{ sortOrder: "asc" }, { fieldKey: "asc" }],
              select: {
                fieldKey: true,
                sortOrder: true,
                isRequired: true,
                isFrontendFilterEnabled: true
              }
            }
          }
        },
        section: {
          select: {
            slug: true,
            label: true
          }
        }
      }
    });

    if (!category) {
      return {
        category: null,
        listings: []
      };
    }

    const listings = await prisma.listing.findMany({
      where: {
        status: PUBLIC_LISTING_STATUS,
        currentPublishedRevisionId: {
          not: null
        },
        categories: {
          some: {
            category: {
              slug: categorySlug,
              isActive: true
            }
          }
        }
      },
      orderBy: [{ createdAt: "desc" }],
      take: 100,
      ...listingWithRelations
    });

    if (listings.length === 0) {
      return {
        category: null,
        listings: []
      };
    }

    return {
      category: {
        slug: category.slug,
        label: category.label,
        iconName: normalizeUiIconName(category.iconName),
        sectionSlug: category.section.slug,
        sectionLabel: category.section.label,
        schema: category.schema
          ? {
              slug: category.schema.slug,
              label: category.schema.label,
              fields: category.schema.fields
            }
          : null
      },
      listings: listings.map(toListingCard)
    };
  } catch {
    return {
      category: null,
      listings: []
    };
  }
}

export async function getListingByCategoryAndSlug(
  categorySlug: string,
  listingSlug: string
): Promise<ListingDetail | null> {
  if (!process.env.DATABASE_URL) {
    const mock = mockListings.find((item) => item.slug === listingSlug || item.id === listingSlug);
    if (!mock) {
      return null;
    }

    const belongsToCategory = mock.categories.some((item) => item.slug === categorySlug);
    if (!belongsToCategory || mock.primaryCategory.slug !== categorySlug) {
      return null;
    }

    return toFallbackListingDetail(mock);
  }

  try {
    const listing = await prisma.listing.findFirst({
      where: {
        status: PUBLIC_LISTING_STATUS,
        currentPublishedRevisionId: {
          not: null
        },
        slug: listingSlug,
        primaryCategory: {
          slug: categorySlug,
          isActive: true,
          section: {
            isActive: true
          }
        }
      },
      ...listingWithRelations
    });

    if (!listing) {
      return null;
    }

    return toListingDetail(listing);
  } catch {
    return null;
  }
}
