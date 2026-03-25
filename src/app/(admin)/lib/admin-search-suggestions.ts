import { Prisma } from "@prisma/client";
import type { AuthUser } from "./admin-auth";
import { formatAdminDateTime } from "./admin-date-format";
import { prisma } from "@/lib/prisma";

export type AdminSearchSuggestionRow = {
  id: string;
  label: string;
  query: string;
  priority: number;
  isActive: boolean;
  updatedAtLabel: string;
};

export type AdminSearchSuggestionsQuery = {
  query?: string;
  status?: string;
  sort?: string;
  dir?: string;
  page?: number;
  pageSize?: number;
};

export type AdminSearchSuggestionsSortField = "updatedAt" | "label" | "status" | "priority";
export type AdminSearchSuggestionsSortDirection = "ascending" | "descending";

export type AdminSearchSuggestionsPageData = {
  suggestions: AdminSearchSuggestionRow[];
  total: number;
  page: number;
  pageSize: number;
  statusCounts: {
    total: number;
    active: number;
    inactive: number;
  };
};

const DEFAULT_ADMIN_SEARCH_SUGGESTIONS_SORT_FIELD: AdminSearchSuggestionsSortField = "priority";
const DEFAULT_ADMIN_SEARCH_SUGGESTIONS_SORT_DIRECTION: AdminSearchSuggestionsSortDirection = "descending";

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

function normalizeAdminSearchSuggestionsSortField(value?: string): AdminSearchSuggestionsSortField {
  if (value === "updatedAt" || value === "label" || value === "status") {
    return value;
  }

  return DEFAULT_ADMIN_SEARCH_SUGGESTIONS_SORT_FIELD;
}

function normalizeAdminSearchSuggestionsSortDirection(value?: string): AdminSearchSuggestionsSortDirection {
  if (value === "ascending" || value === "descending") {
    return value;
  }

  return DEFAULT_ADMIN_SEARCH_SUGGESTIONS_SORT_DIRECTION;
}

function getAdminSearchSuggestionsOrderBy(
  sortField: AdminSearchSuggestionsSortField,
  sortDirection: Prisma.SortOrder
): Prisma.SearchSuggestionOrderByWithRelationInput[] {
  switch (sortField) {
    case "label":
      return [{ label: sortDirection }, { priority: "desc" }, { updatedAt: "desc" }];
    case "status":
      return [{ isActive: sortDirection }, { priority: "desc" }, { updatedAt: "desc" }];
    case "updatedAt":
      return [{ updatedAt: sortDirection }, { priority: "desc" }, { label: "asc" }];
    default:
      return [{ priority: sortDirection }, { updatedAt: "desc" }, { label: "asc" }];
  }
}

function toAdminSearchSuggestionRow(row: {
  id: string;
  label: string;
  query: string;
  priority: number;
  isActive: boolean;
  updatedAt: Date;
}): AdminSearchSuggestionRow {
  return {
    id: row.id,
    label: row.label,
    query: row.query,
    priority: row.priority,
    isActive: row.isActive,
    updatedAtLabel: formatAdminDateTime(row.updatedAt)
  };
}

function toAdminSearchSuggestionStatusCounts(groups: Array<{ isActive: boolean; _count: { _all: number } }>) {
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

export async function getAdminSearchSuggestionsPageData(
  user: AuthUser,
  query: AdminSearchSuggestionsQuery = {}
): Promise<AdminSearchSuggestionsPageData> {
  const pageSize = [10, 25, 50].includes(query.pageSize ?? 25) ? (query.pageSize ?? 25) : 25;
  const page = Math.max(1, query.page ?? 1);
  const sort = normalizeAdminSearchSuggestionsSortField(query.sort);
  const dir = normalizeAdminSearchSuggestionsSortDirection(query.dir);
  const orderBy = getAdminSearchSuggestionsOrderBy(sort, dir === "descending" ? "desc" : "asc");

  if (!hasDatabaseUrl() || user.role !== "ADMINISTRATOR") {
    return {
      suggestions: [],
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

  const where: Prisma.SearchSuggestionWhereInput = {
    ...(normalizedStatus === "active" ? { isActive: true } : {}),
    ...(normalizedStatus === "inactive" ? { isActive: false } : {}),
    ...(normalizedQuery
      ? {
          OR: [{ label: { contains: normalizedQuery } }, { query: { contains: normalizedQuery } }]
        }
      : {})
  };

  try {
    const [rows, total, statusGroups] = await Promise.all([
      prisma.searchSuggestion.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          label: true,
          query: true,
          priority: true,
          isActive: true,
          updatedAt: true
        }
      }),
      prisma.searchSuggestion.count({ where }),
      prisma.searchSuggestion.groupBy({
        by: ["isActive"],
        _count: {
          _all: true
        }
      })
    ]);

    return {
      suggestions: rows.map(toAdminSearchSuggestionRow),
      total,
      page,
      pageSize,
      statusCounts: toAdminSearchSuggestionStatusCounts(statusGroups)
    };
  } catch {
    return {
      suggestions: [],
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
