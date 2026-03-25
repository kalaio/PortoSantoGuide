import { Prisma } from "@prisma/client";
import type { AuthUser } from "@/lib/admin-auth";
import { formatAdminDateTime } from "@/lib/admin-date-format";
import { prisma } from "@/lib/prisma";

export type AdminSectionRecord = {
  id: string;
  slug: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
};

export type AdminSectionRow = AdminSectionRecord & {
  updatedAtLabel: string;
};

export type AdminSectionsQuery = {
  query?: string;
  status?: string;
  sort?: string;
  dir?: string;
  page?: number;
  pageSize?: number;
};

export type AdminSectionsSortField = "updatedAt" | "label" | "status" | "sortOrder";
export type AdminSectionsSortDirection = "ascending" | "descending";

export type AdminSectionsPageData = {
  sections: AdminSectionRow[];
  total: number;
  page: number;
  pageSize: number;
  statusCounts: {
    total: number;
    active: number;
    inactive: number;
  };
};

const DEFAULT_ADMIN_SECTIONS_SORT_FIELD: AdminSectionsSortField = "sortOrder";
const DEFAULT_ADMIN_SECTIONS_SORT_DIRECTION: AdminSectionsSortDirection = "ascending";

function normalizeAdminSectionsSortField(value?: string): AdminSectionsSortField {
  if (value === "updatedAt" || value === "label" || value === "status") {
    return value;
  }

  return DEFAULT_ADMIN_SECTIONS_SORT_FIELD;
}

function normalizeAdminSectionsSortDirection(value?: string): AdminSectionsSortDirection {
  if (value === "ascending" || value === "descending") {
    return value;
  }

  return DEFAULT_ADMIN_SECTIONS_SORT_DIRECTION;
}

function getAdminSectionsOrderBy(
  sortField: AdminSectionsSortField,
  sortDirection: Prisma.SortOrder
): Prisma.DirectorySectionOrderByWithRelationInput[] {
  switch (sortField) {
    case "label":
      return [{ label: sortDirection }, { sortOrder: "asc" }, { updatedAt: "desc" }];
    case "status":
      return [{ isActive: sortDirection }, { sortOrder: "asc" }, { label: "asc" }];
    case "updatedAt":
      return [{ updatedAt: sortDirection }, { sortOrder: "asc" }, { label: "asc" }];
    default:
      return [{ sortOrder: sortDirection }, { label: sortDirection }, { updatedAt: "desc" }];
  }
}

function toAdminSectionRow(row: {
  id: string;
  slug: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: Date;
}): AdminSectionRow {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    updatedAtLabel: formatAdminDateTime(row.updatedAt)
  };
}

function toAdminSectionStatusCounts(groups: Array<{ isActive: boolean; _count: { _all: number } }>) {
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

export async function getAdminSections(user: AuthUser): Promise<AdminSectionRecord[]> {
  if (!hasDatabaseUrl() || user.role !== "ADMINISTRATOR") {
    return [];
  }

  try {
    return await prisma.directorySection.findMany({
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      select: {
        id: true,
        slug: true,
        label: true,
        sortOrder: true,
        isActive: true
      }
    });
  } catch {
    return [];
  }
}

export async function getAdminSectionsPageData(
  user: AuthUser,
  query: AdminSectionsQuery = {}
): Promise<AdminSectionsPageData> {
  const pageSize = [10, 25, 50].includes(query.pageSize ?? 25) ? (query.pageSize ?? 25) : 25;
  const page = Math.max(1, query.page ?? 1);
  const sort = normalizeAdminSectionsSortField(query.sort);
  const dir = normalizeAdminSectionsSortDirection(query.dir);
  const orderBy = getAdminSectionsOrderBy(sort, dir === "descending" ? "desc" : "asc");

  if (!hasDatabaseUrl() || user.role !== "ADMINISTRATOR") {
    return {
      sections: [],
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

  const where: Prisma.DirectorySectionWhereInput = {
    ...(normalizedStatus === "active" ? { isActive: true } : {}),
    ...(normalizedStatus === "inactive" ? { isActive: false } : {}),
    ...(normalizedQuery
      ? {
          OR: [{ label: { contains: normalizedQuery } }, { slug: { contains: normalizedQuery } }]
        }
      : {})
  };

  try {
    const [rows, total, statusGroups] = await Promise.all([
      prisma.directorySection.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          slug: true,
          label: true,
          sortOrder: true,
          isActive: true,
          updatedAt: true
        }
      }),
      prisma.directorySection.count({ where }),
      prisma.directorySection.groupBy({
        by: ["isActive"],
        _count: {
          _all: true
        }
      })
    ]);

    return {
      sections: rows.map(toAdminSectionRow),
      total,
      page,
      pageSize,
      statusCounts: toAdminSectionStatusCounts(statusGroups)
    };
  } catch {
    return {
      sections: [],
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
