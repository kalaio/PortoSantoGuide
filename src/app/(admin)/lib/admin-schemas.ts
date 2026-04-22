import { Prisma } from "@prisma/client";
import type { AuthUser } from "./admin-auth";
import { formatAdminDateTime } from "./admin-date-format";
import { getListingFieldByKey } from "@/lib/listing-fields";
import { prisma } from "@/lib/prisma";

export type AdminSchemaFieldRecord = {
  fieldKey: string;
  isRequired: boolean;
  sortOrder: number;
  isFrontendFilterEnabled: boolean;
  label: string;
  supportsFrontendFilter: boolean;
};

export type AdminSchemaPhotoSectionRecord = {
  id: string;
  slug: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
};

export type AdminSchemaRecord = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  fields: AdminSchemaFieldRecord[];
  photoSections: AdminSchemaPhotoSectionRecord[];
};

export type AdminSchemaRow = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  updatedAtLabel: string;
  fieldCount: number;
  frontendFilterCount: number;
};

export type AdminSchemasQuery = {
  query?: string;
  status?: string;
  frontendFilters?: string;
  sort?: string;
  dir?: string;
  page?: number;
  pageSize?: number;
};

export type AdminSchemasSortField = "updatedAt" | "label" | "status" | "sortOrder" | "fieldCount";
export type AdminSchemasSortDirection = "ascending" | "descending";

export type AdminSchemasPageData = {
  schemas: AdminSchemaRow[];
  total: number;
  page: number;
  pageSize: number;
  statusCounts: {
    total: number;
    active: number;
    inactive: number;
  };
};

const DEFAULT_ADMIN_SCHEMAS_SORT_FIELD: AdminSchemasSortField = "sortOrder";
const DEFAULT_ADMIN_SCHEMAS_SORT_DIRECTION: AdminSchemasSortDirection = "ascending";

function normalizeAdminSchemasSortField(value?: string): AdminSchemasSortField {
  if (value === "updatedAt" || value === "label" || value === "status" || value === "fieldCount") {
    return value;
  }

  return DEFAULT_ADMIN_SCHEMAS_SORT_FIELD;
}

function normalizeAdminSchemasSortDirection(value?: string): AdminSchemasSortDirection {
  if (value === "ascending" || value === "descending") {
    return value;
  }

  return DEFAULT_ADMIN_SCHEMAS_SORT_DIRECTION;
}

function getAdminSchemasOrderBy(
  sortField: AdminSchemasSortField,
  sortDirection: Prisma.SortOrder
): Prisma.ListingSchemaOrderByWithRelationInput[] {
  switch (sortField) {
    case "label":
      return [{ label: sortDirection }, { sortOrder: "asc" }, { updatedAt: "desc" }];
    case "status":
      return [{ isActive: sortDirection }, { sortOrder: "asc" }, { label: "asc" }];
    case "updatedAt":
      return [{ updatedAt: sortDirection }, { sortOrder: "asc" }, { label: "asc" }];
    case "fieldCount":
      return [{ fields: { _count: sortDirection } }, { sortOrder: "asc" }, { label: "asc" }];
    default:
      return [{ sortOrder: sortDirection }, { label: sortDirection }, { updatedAt: "desc" }];
  }
}

function toAdminSchemaRow(row: {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  updatedAt: Date;
  fields: Array<{
    isFrontendFilterEnabled: boolean;
  }>;
}): AdminSchemaRow {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    description: row.description,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    updatedAtLabel: formatAdminDateTime(row.updatedAt),
    fieldCount: row.fields.length,
    frontendFilterCount: row.fields.filter((field) => field.isFrontendFilterEnabled).length
  };
}

function toAdminSchemaStatusCounts(groups: Array<{ isActive: boolean; _count: { _all: number } }>) {
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

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export async function getAdminSchemas(user: AuthUser): Promise<AdminSchemaRecord[]> {
  if (!hasDatabaseUrl() || user.role !== "ADMINISTRATOR") {
    return [];
  }

  try {
    const schemas = await prisma.listingSchema.findMany({
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      select: {
        id: true,
        slug: true,
        label: true,
        description: true,
        sortOrder: true,
        isActive: true,
        fields: {
          orderBy: [{ sortOrder: "asc" }, { fieldKey: "asc" }],
          select: {
            fieldKey: true,
            isRequired: true,
            sortOrder: true,
            isFrontendFilterEnabled: true
          }
        },
        photoSections: {
          orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
          select: {
            id: true,
            slug: true,
            label: true,
            sortOrder: true,
            isActive: true
          }
        }
      }
    });

    return schemas.map((schema) => ({
      ...schema,
      fields: schema.fields.map((field) => ({
        ...field,
        label: getListingFieldByKey(field.fieldKey)?.label ?? field.fieldKey,
        supportsFrontendFilter: getListingFieldByKey(field.fieldKey)?.supportsFrontendFilter ?? false
      }))
    }));
  } catch {
    return [];
  }
}

export async function getAdminSchemasPageData(
  user: AuthUser,
  query: AdminSchemasQuery = {}
): Promise<AdminSchemasPageData> {
  const pageSize = [10, 25, 50].includes(query.pageSize ?? 25) ? (query.pageSize ?? 25) : 25;
  const page = Math.max(1, query.page ?? 1);
  const sort = normalizeAdminSchemasSortField(query.sort);
  const dir = normalizeAdminSchemasSortDirection(query.dir);
  const orderBy = getAdminSchemasOrderBy(sort, dir === "descending" ? "desc" : "asc");

  if (!hasDatabaseUrl() || user.role !== "ADMINISTRATOR") {
    return {
      schemas: [],
      total: 0,
      page,
      pageSize,
      statusCounts: {
        total: 0,
        active: 0,
        inactive: 0
      }
    };
  }

  const normalizedQuery = query.query?.trim();
  const normalizedStatus = query.status && query.status !== "all" ? query.status : undefined;
  const normalizedFrontendFilters =
    query.frontendFilters && query.frontendFilters !== "all" ? query.frontendFilters : undefined;

  const where: Prisma.ListingSchemaWhereInput = {
    ...(normalizedStatus === "active" ? { isActive: true } : {}),
    ...(normalizedStatus === "inactive" ? { isActive: false } : {}),
    ...(normalizedFrontendFilters === "enabled"
      ? {
          fields: {
            some: {
              isFrontendFilterEnabled: true
            }
          }
        }
      : {}),
    ...(normalizedFrontendFilters === "disabled"
      ? {
          fields: {
            none: {
              isFrontendFilterEnabled: true
            }
          }
        }
      : {}),
    ...(normalizedQuery
      ? {
          OR: [
            { label: { contains: normalizedQuery } },
            { slug: { contains: normalizedQuery } },
            { description: { contains: normalizedQuery } }
          ]
        }
      : {})
  };

  try {
    const [rows, total, statusGroups] = await Promise.all([
      prisma.listingSchema.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          slug: true,
          label: true,
          description: true,
          sortOrder: true,
          isActive: true,
          updatedAt: true,
          fields: {
            select: {
              isFrontendFilterEnabled: true
            }
          }
        }
      }),
      prisma.listingSchema.count({ where }),
      prisma.listingSchema.groupBy({
        by: ["isActive"],
        _count: {
          _all: true
        }
      })
    ]);

    return {
      schemas: rows.map(toAdminSchemaRow),
      total,
      page,
      pageSize,
      statusCounts: toAdminSchemaStatusCounts(statusGroups)
    };
  } catch {
    return {
      schemas: [],
      total: 0,
      page,
      pageSize,
      statusCounts: {
        total: 0,
        active: 0,
        inactive: 0
      }
    };
  }
}
