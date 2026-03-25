import { Prisma, type ListingStatus } from "@prisma/client";
import type { ListingDetails } from "@/lib/listing-details";
import { formatAdminDateTime } from "@/lib/admin-date-format";
import type { ListingSchemaFieldSummary } from "@/types/listing";
import { toListingDetails } from "@/lib/listing-details";
import type { AuthUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export type AdminListingRow = {
  id: string;
  slug: string;
  title: string;
  status: ListingStatus;
  hasDraftRevision: boolean;
  updatedAtLabel: string;
  primaryCategorySlug: string;
  primaryCategoryLabel: string;
  sectionLabel: string;
  categoryLabels: string[];
};

export type AdminListingDetail = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: ListingStatus;
  liveStatus: ListingStatus;
  hasDraftRevision: boolean;
  latitude: number | null;
  longitude: number | null;
  details: ListingDetails;
  primaryCategoryId: string;
  primarySchema: {
    fields: ListingSchemaFieldSummary[];
  } | null;
  categoryIds: string[];
};

export type AdminListingsQuery = {
  query?: string;
  status?: string;
  section?: string;
  category?: string;
  sort?: string;
  dir?: string;
  page?: number;
  pageSize?: number;
};

export type AdminListingsSortField = "updatedAt" | "title" | "status";
export type AdminListingsSortDirection = "ascending" | "descending";

export type AdminListingsPageData = {
  listings: AdminListingRow[];
  total: number;
  page: number;
  pageSize: number;
  statusCounts: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };
  sectionOptions: string[];
  categoryOptions: string[];
};

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

const revisionFieldOrderBy: Prisma.ListingSchemaFieldOrderByWithRelationInput[] = [
  { sortOrder: "asc" },
  { fieldKey: "asc" }
];

const DEFAULT_ADMIN_LISTINGS_SORT_FIELD: AdminListingsSortField = "updatedAt";
const DEFAULT_ADMIN_LISTINGS_SORT_DIRECTION: AdminListingsSortDirection = "descending";

function normalizeAdminListingsSortField(value?: string): AdminListingsSortField {
  if (value === "title" || value === "status") {
    return value;
  }

  return DEFAULT_ADMIN_LISTINGS_SORT_FIELD;
}

function normalizeAdminListingsSortDirection(value?: string): AdminListingsSortDirection {
  if (value === "ascending" || value === "descending") {
    return value;
  }

  return DEFAULT_ADMIN_LISTINGS_SORT_DIRECTION;
}

function getAdminListingsOrderBy(
  sortField: AdminListingsSortField,
  sortDirection: Prisma.SortOrder
): Prisma.ListingOrderByWithRelationInput[] {
  switch (sortField) {
    case "title":
      return [
        { currentDraftRevision: { title: sortDirection } },
        { currentPublishedRevision: { title: sortDirection } },
        { updatedAt: "desc" },
        { createdAt: "desc" }
      ];
    case "status":
      return [{ status: sortDirection }, { updatedAt: "desc" }, { createdAt: "desc" }];
    default:
      return [{ updatedAt: sortDirection }, { createdAt: sortDirection }];
  }
}

const adminListingListRevisionArgs = Prisma.validator<Prisma.ListingRevisionDefaultArgs>()({
  select: {
    slug: true,
    title: true,
    updatedAt: true,
    primaryCategory: {
      select: {
        slug: true,
        label: true,
        section: {
          select: {
            label: true
          }
        }
      }
    },
    categories: {
      select: {
        category: {
          select: {
            label: true
          }
        }
      }
    }
  }
});

const adminListingRevisionArgs = Prisma.validator<Prisma.ListingRevisionDefaultArgs>()({
  select: {
    slug: true,
    title: true,
    description: true,
    status: true,
    latitude: true,
    longitude: true,
    details: true,
    updatedAt: true,
    primaryCategoryId: true,
    primaryCategory: {
      select: {
        slug: true,
        label: true,
        schema: {
          select: {
            fields: {
              orderBy: revisionFieldOrderBy,
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
            label: true
          }
        }
      }
    },
    categories: {
      select: {
        categoryId: true,
        category: {
          select: {
            label: true
          }
        }
      }
    }
  }
});

type AdminRevisionShape = Prisma.ListingRevisionGetPayload<typeof adminListingRevisionArgs>;
type AdminListRevisionShape = Prisma.ListingRevisionGetPayload<typeof adminListingListRevisionArgs>;

function getAdminSourceListRevision(item: {
  currentDraftRevision?: AdminListRevisionShape | null;
  currentPublishedRevision?: AdminListRevisionShape | null;
}): AdminListRevisionShape | null {
  return item.currentDraftRevision ?? item.currentPublishedRevision ?? null;
}

function getAdminSourceRevision(item: {
  currentDraftRevision?: AdminRevisionShape | null;
  currentPublishedRevision?: AdminRevisionShape | null;
}): AdminRevisionShape | null {
  return item.currentDraftRevision ?? item.currentPublishedRevision ?? null;
}

function toAdminListingRow(
  row: {
    id: string;
    status: ListingStatus;
    currentDraftRevisionId: string | null;
    currentDraftRevision?: AdminListRevisionShape | null;
    currentPublishedRevision?: AdminListRevisionShape | null;
  }
): AdminListingRow | null {
  const source = getAdminSourceListRevision(row);

  if (!source) {
    return null;
  }

  return {
    id: row.id,
    slug: source.slug,
    title: source.title,
    status: row.status,
    hasDraftRevision: Boolean(row.currentDraftRevisionId),
    updatedAtLabel: formatAdminDateTime(source.updatedAt),
    primaryCategorySlug: source.primaryCategory.slug,
    primaryCategoryLabel: source.primaryCategory.label,
    sectionLabel: source.primaryCategory.section.label,
    categoryLabels: source.categories.map(({ category }) => category.label)
  };
}

function toAdminStatusCounts(groups: Array<{ status: ListingStatus; _count: { _all: number } }>) {
  const counts = {
    total: 0,
    published: 0,
    draft: 0,
    archived: 0
  };

  for (const group of groups) {
    counts.total += group._count._all;

    if (group.status === "PUBLISHED") {
      counts.published = group._count._all;
    }

    if (group.status === "DRAFT") {
      counts.draft = group._count._all;
    }

    if (group.status === "ARCHIVED") {
      counts.archived = group._count._all;
    }
  }

  return counts;
}

export async function getAdminListings(user: AuthUser): Promise<AdminListingRow[]> {
  if (!hasDatabaseUrl()) {
    return [];
  }

  if (user.role === "SUBSCRIBER") {
    return [];
  }

  try {
    const rows = await prisma.listing.findMany({
      select: {
        id: true,
        status: true,
        currentDraftRevisionId: true,
        currentPublishedRevision: {
          ...adminListingListRevisionArgs
        },
        currentDraftRevision: {
          ...adminListingListRevisionArgs
        }
      },
      where: user.role === "OWNER" ? { ownerId: user.userId } : undefined,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }]
    });

    return rows
      .map(toAdminListingRow)
      .filter((row): row is AdminListingRow => row !== null);
  } catch {
    return [];
  }
}

export async function getAdminListingsPageData(
  user: AuthUser,
  query: AdminListingsQuery = {}
): Promise<AdminListingsPageData> {
  const pageSize = [10, 25, 50].includes(query.pageSize ?? 25) ? (query.pageSize ?? 25) : 25;
  const page = Math.max(1, query.page ?? 1);
  const sort = normalizeAdminListingsSortField(query.sort);
  const dir = normalizeAdminListingsSortDirection(query.dir);
  const orderBy = getAdminListingsOrderBy(sort, dir === "ascending" ? "asc" : "desc");

  if (!hasDatabaseUrl() || user.role === "SUBSCRIBER") {
    return {
      listings: [],
      total: 0,
      page,
      pageSize,
      statusCounts: {
        total: 0,
        published: 0,
        draft: 0,
        archived: 0
      },
      sectionOptions: [],
      categoryOptions: []
    };
  }

  const ownerWhere = user.role === "OWNER" ? { ownerId: user.userId } : {};
  const normalizedQuery = query.query?.trim();
  const normalizedStatus = query.status && query.status !== "all" ? query.status : undefined;
  const normalizedSection = query.section && query.section !== "all" ? query.section : undefined;
  const normalizedCategory = query.category && query.category !== "all" ? query.category : undefined;

  const sourceRevisionFilters: Prisma.ListingWhereInput[] = [];

  if (normalizedQuery && normalizedQuery.length > 0) {
    sourceRevisionFilters.push({
      OR: [
        { currentDraftRevision: { is: { title: { contains: normalizedQuery } } } },
        { currentDraftRevision: { is: { slug: { contains: normalizedQuery } } } },
        { currentDraftRevision: { is: { primaryCategory: { label: { contains: normalizedQuery } } } } },
        {
          currentDraftRevision: {
            is: {
              categories: {
                some: {
                  category: {
                    label: { contains: normalizedQuery }
                  }
                }
              }
            }
          }
        },
        { currentPublishedRevision: { is: { title: { contains: normalizedQuery } } } },
        { currentPublishedRevision: { is: { slug: { contains: normalizedQuery } } } },
        { currentPublishedRevision: { is: { primaryCategory: { label: { contains: normalizedQuery } } } } },
        {
          currentPublishedRevision: {
            is: {
              categories: {
                some: {
                  category: {
                    label: { contains: normalizedQuery }
                  }
                }
              }
            }
          }
        }
      ]
    });
  }

  if (normalizedSection) {
    sourceRevisionFilters.push({
      OR: [
        { currentDraftRevision: { is: { primaryCategory: { section: { label: normalizedSection } } } } },
        { currentPublishedRevision: { is: { primaryCategory: { section: { label: normalizedSection } } } } }
      ]
    });
  }

  if (normalizedCategory) {
    sourceRevisionFilters.push({
      OR: [
        { currentDraftRevision: { is: { primaryCategory: { label: normalizedCategory } } } },
        {
          currentDraftRevision: {
            is: {
              categories: {
                some: {
                  category: { label: normalizedCategory }
                }
              }
            }
          }
        },
        { currentPublishedRevision: { is: { primaryCategory: { label: normalizedCategory } } } },
        {
          currentPublishedRevision: {
            is: {
              categories: {
                some: {
                  category: { label: normalizedCategory }
                }
              }
            }
          }
        }
      ]
    });
  }

  const where: Prisma.ListingWhereInput = {
    ...ownerWhere,
    ...(normalizedStatus ? { status: normalizedStatus as ListingStatus } : {}),
    ...(sourceRevisionFilters.length > 0 ? { AND: sourceRevisionFilters } : {})
  };

  try {
    const [rows, total, statusGroups, sections, categories] = await Promise.all([
      prisma.listing.findMany({
        select: {
          id: true,
          status: true,
          currentDraftRevisionId: true,
          currentPublishedRevision: {
            ...adminListingListRevisionArgs
          },
          currentDraftRevision: {
            ...adminListingListRevisionArgs
          }
        },
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.listing.count({ where }),
      prisma.listing.groupBy({
        by: ["status"],
        where: ownerWhere,
        _count: {
          _all: true
        }
      }),
      prisma.directorySection.findMany({
        where: {
          isActive: true,
          categories: {
            some: {
              primaryListings: {
                some: ownerWhere
              }
            }
          }
        },
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
        select: {
          label: true
        }
      }),
      prisma.listingCategory.findMany({
        where: {
          isActive: true,
          OR: [
            {
              primaryListings: {
                some: ownerWhere
              }
            },
            {
              assignments: {
                some: {
                  listing: ownerWhere
                }
              }
            }
          ]
        },
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
        select: {
          label: true
        }
      })
    ]);

    const listings = rows
      .map(toAdminListingRow)
      .filter((row): row is AdminListingRow => row !== null);

    const statusCounts = toAdminStatusCounts(statusGroups);

    return {
      listings,
      total,
      page,
      pageSize,
      statusCounts,
      sectionOptions: sections.map((section) => section.label),
      categoryOptions: categories.map((category) => category.label)
    };
  } catch {
    return {
      listings: [],
      total: 0,
      page,
      pageSize,
      statusCounts: {
        total: 0,
        published: 0,
        draft: 0,
        archived: 0
      },
      sectionOptions: [],
      categoryOptions: []
    };
  }
}

export async function getAdminListingById(user: AuthUser, id: string): Promise<AdminListingDetail | null> {
  if (!hasDatabaseUrl()) {
    return null;
  }

  if (user.role === "SUBSCRIBER") {
    return null;
  }

  try {
    const listing = await prisma.listing.findFirst({
      where: {
        id,
        ...(user.role === "OWNER" ? { ownerId: user.userId } : {})
      },
      select: {
        id: true,
        status: true,
        currentPublishedRevision: {
          ...adminListingRevisionArgs
        },
        currentDraftRevision: {
          ...adminListingRevisionArgs
        }
      }
    });

    if (!listing) {
      return null;
    }

    const source = getAdminSourceRevision(listing);

    if (!source) {
      return null;
    }

    return {
      id: listing.id,
      slug: source.slug,
      title: source.title,
      description: source.description,
      status: listing.status,
      liveStatus: listing.status,
      hasDraftRevision: Boolean(listing.currentDraftRevision),
      latitude: source.latitude,
      longitude: source.longitude,
      details: toListingDetails(source.details),
      primaryCategoryId: source.primaryCategoryId,
      primarySchema: source.primaryCategory.schema
        ? {
            fields: source.primaryCategory.schema.fields
          }
        : null,
      categoryIds: source.categories.map((item) => item.categoryId)
    };
  } catch {
    return null;
  }
}
