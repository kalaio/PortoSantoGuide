import { Prisma } from "@prisma/client";
import type { AuthUser } from "./admin-auth";
import { formatAdminDateTime } from "./admin-date-format";
import { prisma } from "@/lib/prisma";
import { normalizeUiIconName } from "@/lib/ui-icons";

export type AdminCategoryRow = {
  id: string;
  slug: string;
  label: string;
  iconName: string | null;
  sortOrder: number;
  isActive: boolean;
  updatedAtLabel: string;
  section: {
    slug: string;
    label: string;
  };
  schema: {
    slug: string;
    label: string;
  } | null;
};

export type AdminCategoryFilterOption = {
  value: string;
  label: string;
};

export type AdminCategoriesQuery = {
  query?: string;
  status?: string;
  section?: string;
  schema?: string;
  sort?: string;
  dir?: string;
  page?: number;
  pageSize?: number;
};

export type AdminCategoriesSortField = "updatedAt" | "label" | "status" | "sortOrder";
export type AdminCategoriesSortDirection = "ascending" | "descending";

export type AdminCategoriesPageData = {
  categories: AdminCategoryRow[];
  total: number;
  page: number;
  pageSize: number;
  statusCounts: {
    total: number;
    active: number;
    inactive: number;
  };
  sectionOptions: AdminCategoryFilterOption[];
  schemaOptions: AdminCategoryFilterOption[];
  hasUnassignedSchema: boolean;
};

const DEFAULT_ADMIN_CATEGORIES_SORT_FIELD: AdminCategoriesSortField = "sortOrder";
const DEFAULT_ADMIN_CATEGORIES_SORT_DIRECTION: AdminCategoriesSortDirection = "ascending";

function normalizeAdminCategoriesSortField(value?: string): AdminCategoriesSortField {
  if (value === "updatedAt" || value === "label" || value === "status") {
    return value;
  }

  return DEFAULT_ADMIN_CATEGORIES_SORT_FIELD;
}

function normalizeAdminCategoriesSortDirection(value?: string): AdminCategoriesSortDirection {
  if (value === "ascending" || value === "descending") {
    return value;
  }

  return DEFAULT_ADMIN_CATEGORIES_SORT_DIRECTION;
}

function getAdminCategoriesOrderBy(
  sortField: AdminCategoriesSortField,
  sortDirection: Prisma.SortOrder
): Prisma.ListingCategoryOrderByWithRelationInput[] {
  switch (sortField) {
    case "label":
      return [{ label: sortDirection }, { sortOrder: "asc" }, { updatedAt: "desc" }];
    case "status":
      return [{ isActive: sortDirection }, { sortOrder: "asc" }, { label: "asc" }];
    case "updatedAt":
      return [{ updatedAt: sortDirection }, { sortOrder: "asc" }, { label: "asc" }];
    default:
      return [
        { section: { sortOrder: "asc" } },
        { sortOrder: sortDirection },
        { label: sortDirection },
        { updatedAt: "desc" }
      ];
  }
}

function toAdminCategoryRow(row: {
  id: string;
  slug: string;
  label: string;
  iconName: string | null;
  sortOrder: number;
  isActive: boolean;
  updatedAt: Date;
  section: {
    slug: string;
    label: string;
  };
  schema: {
    slug: string;
    label: string;
  } | null;
}): AdminCategoryRow {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    iconName: normalizeUiIconName(row.iconName),
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    updatedAtLabel: formatAdminDateTime(row.updatedAt),
    section: row.section,
    schema: row.schema
  };
}

function toAdminCategoryStatusCounts(groups: Array<{ isActive: boolean; _count: { _all: number } }>) {
  const counts = {
    total: 0,
    active: 0,
    inactive: 0
  };

  for (const group of groups) {
    counts.total += group._count._all;

    if (group.isActive) {
      counts.active = group._count._all;
    } else {
      counts.inactive = group._count._all;
    }
  }

  return counts;
}

export type AdminCategoryOption = {
  id: string;
  slug: string;
  label: string;
  iconName: string | null;
  sectionId: string;
  schemaId: string | null;
  sortOrder: number;
  isActive: boolean;
  section: {
    slug: string;
    label: string;
    isActive: boolean;
  };
  schema: {
    slug: string;
    label: string;
    isActive: boolean;
    fields: Array<{
      fieldKey: string;
      sortOrder: number;
      isRequired: boolean;
      isFrontendFilterEnabled: boolean;
    }>;
  } | null;
};

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export async function getAdminCategoryOptions(user: AuthUser): Promise<AdminCategoryOption[]> {
  if (!hasDatabaseUrl()) {
    return [];
  }

  if (user.role === "SUBSCRIBER") {
    return [];
  }

  try {
    const categories = await prisma.listingCategory.findMany({
      orderBy: [
        {
          section: {
            sortOrder: "asc"
          }
        },
        { sortOrder: "asc" },
        { label: "asc" }
      ],
      select: {
        id: true,
        slug: true,
        label: true,
        iconName: true,
        isActive: true,
        sectionId: true,
        schemaId: true,
        sortOrder: true,
        section: {
          select: {
            slug: true,
            label: true,
            isActive: true
          }
        },
        schema: {
          select: {
            slug: true,
            label: true,
            isActive: true,
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
        }
      }
    });

    return categories.map((category) => ({
      ...category,
      iconName: normalizeUiIconName(category.iconName)
    }));
  } catch {
    return [];
  }
}

export async function getAdminCategoriesPageData(
  user: AuthUser,
  query: AdminCategoriesQuery = {}
): Promise<AdminCategoriesPageData> {
  const pageSize = [10, 25, 50].includes(query.pageSize ?? 25) ? (query.pageSize ?? 25) : 25;
  const page = Math.max(1, query.page ?? 1);
  const sort = normalizeAdminCategoriesSortField(query.sort);
  const dir = normalizeAdminCategoriesSortDirection(query.dir);
  const orderBy = getAdminCategoriesOrderBy(sort, dir === "descending" ? "desc" : "asc");

  if (!hasDatabaseUrl() || user.role !== "ADMINISTRATOR") {
    return {
      categories: [],
      total: 0,
      page,
      pageSize,
      statusCounts: {
        total: 0,
        active: 0,
        inactive: 0
      },
      sectionOptions: [],
      schemaOptions: [],
      hasUnassignedSchema: false
    };
  }

  const normalizedQuery = query.query?.trim();
  const normalizedStatus = query.status && query.status !== "all" ? query.status : undefined;
  const normalizedSection = query.section && query.section !== "all" ? query.section : undefined;
  const normalizedSchema = query.schema && query.schema !== "all" ? query.schema : undefined;

  const where: Prisma.ListingCategoryWhereInput = {
    ...(normalizedStatus === "active" ? { isActive: true } : {}),
    ...(normalizedStatus === "inactive" ? { isActive: false } : {}),
    ...(normalizedSection ? { section: { slug: normalizedSection } } : {}),
    ...(normalizedSchema === "none"
      ? { schemaId: null }
      : normalizedSchema
        ? { schema: { is: { slug: normalizedSchema } } }
        : {}),
    ...(normalizedQuery
      ? {
          OR: [
            { label: { contains: normalizedQuery } },
            { slug: { contains: normalizedQuery } },
            { iconName: { contains: normalizedQuery } },
            { section: { label: { contains: normalizedQuery } } },
            { schema: { is: { label: { contains: normalizedQuery } } } }
          ]
        }
      : {})
  };

  try {
    const [rows, total, statusGroups, sections, schemas, unassignedSchemaCount] = await Promise.all([
      prisma.listingCategory.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          slug: true,
          label: true,
          iconName: true,
          sortOrder: true,
          isActive: true,
          updatedAt: true,
          section: {
            select: {
              slug: true,
              label: true
            }
          },
          schema: {
            select: {
              slug: true,
              label: true
            }
          }
        }
      }),
      prisma.listingCategory.count({ where }),
      prisma.listingCategory.groupBy({
        by: ["isActive"],
        _count: {
          _all: true
        }
      }),
      prisma.directorySection.findMany({
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
        select: {
          slug: true,
          label: true
        }
      }),
      prisma.listingSchema.findMany({
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
        select: {
          slug: true,
          label: true
        }
      }),
      prisma.listingCategory.count({
        where: {
          schemaId: null
        }
      })
    ]);

    return {
      categories: rows.map(toAdminCategoryRow),
      total,
      page,
      pageSize,
      statusCounts: toAdminCategoryStatusCounts(statusGroups),
      sectionOptions: sections.map((section) => ({ value: section.slug, label: section.label })),
      schemaOptions: schemas.map((schema) => ({ value: schema.slug, label: schema.label })),
      hasUnassignedSchema: unassignedSchemaCount > 0
    };
  } catch {
    return {
      categories: [],
      total: 0,
      page,
      pageSize,
      statusCounts: {
        total: 0,
        active: 0,
        inactive: 0
      },
      sectionOptions: [],
      schemaOptions: [],
      hasUnassignedSchema: false
    };
  }
}

export async function getActiveAdminCategoryOptions(user: AuthUser): Promise<AdminCategoryOption[]> {
  const categories = await getAdminCategoryOptions(user);

  return categories.filter(
    (category) => category.isActive && category.section.isActive && (category.schema?.isActive ?? true)
  );
}
