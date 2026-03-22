import { Prisma, type Role } from "@prisma/client";
import type { AuthUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export type AdminUserRow = {
  id: string;
  username: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
};

export type AdminUsersQuery = {
  query?: string;
  role?: string;
  status?: string;
  sort?: string;
  dir?: string;
  page?: number;
  pageSize?: number;
};

export type AdminUsersSortField = "createdAt" | "username" | "role" | "status";
export type AdminUsersSortDirection = "ascending" | "descending";

export type AdminUsersPageData = {
  users: AdminUserRow[];
  total: number;
  page: number;
  pageSize: number;
  statusCounts: {
    total: number;
    active: number;
    inactive: number;
  };
};

const DEFAULT_ADMIN_USERS_SORT_FIELD: AdminUsersSortField = "createdAt";
const DEFAULT_ADMIN_USERS_SORT_DIRECTION: AdminUsersSortDirection = "descending";

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

function normalizeAdminUsersSortField(value?: string): AdminUsersSortField {
  if (value === "username" || value === "role" || value === "status") {
    return value;
  }

  return DEFAULT_ADMIN_USERS_SORT_FIELD;
}

function normalizeAdminUsersSortDirection(value?: string): AdminUsersSortDirection {
  if (value === "ascending" || value === "descending") {
    return value;
  }

  return DEFAULT_ADMIN_USERS_SORT_DIRECTION;
}

function getAdminUsersOrderBy(
  sortField: AdminUsersSortField,
  sortDirection: Prisma.SortOrder
): Prisma.UserOrderByWithRelationInput[] {
  switch (sortField) {
    case "username":
      return [{ username: sortDirection }, { createdAt: "desc" }];
    case "role":
      return [{ role: sortDirection }, { createdAt: "desc" }];
    case "status":
      return [{ isActive: sortDirection }, { createdAt: "desc" }];
    default:
      return [{ createdAt: sortDirection }, { username: "asc" }];
  }
}

function toAdminUserRow(row: {
  id: string;
  username: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
}): AdminUserRow {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString()
  };
}

function toAdminUserStatusCounts(groups: Array<{ isActive: boolean; _count: { _all: number } }>) {
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

export async function getAdminUsersPageData(
  user: AuthUser,
  query: AdminUsersQuery = {}
): Promise<AdminUsersPageData> {
  const pageSize = [10, 25, 50].includes(query.pageSize ?? 25) ? (query.pageSize ?? 25) : 25;
  const page = Math.max(1, query.page ?? 1);
  const sort = normalizeAdminUsersSortField(query.sort);
  const dir = normalizeAdminUsersSortDirection(query.dir);
  const orderBy = getAdminUsersOrderBy(sort, dir === "descending" ? "desc" : "asc");

  if (!hasDatabaseUrl() || user.role !== "ADMINISTRATOR") {
    return {
      users: [],
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
  const normalizedRole = query.role && query.role !== "all" ? query.role : undefined;
  const normalizedStatus = query.status && query.status !== "all" ? query.status : undefined;

  const where: Prisma.UserWhereInput = {
    ...(normalizedRole === "ADMINISTRATOR" || normalizedRole === "OWNER" || normalizedRole === "SUBSCRIBER"
      ? { role: normalizedRole }
      : {}),
    ...(normalizedStatus === "active" ? { isActive: true } : {}),
    ...(normalizedStatus === "inactive" ? { isActive: false } : {}),
    ...(normalizedQuery
      ? {
          OR: [{ username: { contains: normalizedQuery } }, { email: { contains: normalizedQuery } }]
        }
      : {})
  };

  try {
    const [rows, total, statusGroups] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      }),
      prisma.user.count({ where }),
      prisma.user.groupBy({
        by: ["isActive"],
        _count: {
          _all: true
        }
      })
    ]);

    return {
      users: rows.map(toAdminUserRow),
      total,
      page,
      pageSize,
      statusCounts: toAdminUserStatusCounts(statusGroups)
    };
  } catch {
    return {
      users: [],
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
