"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchLinearIcon } from "@heroui/shared-icons";
import type { SortDescriptor } from "@react-types/shared";
import {
  Chip,
  Input,
  Pagination,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow
} from "@heroui/react";
import {
  ADMIN_HEADER_ROW_DENSE_CLASS,
  ADMIN_METRICS_CLASS,
  ADMIN_SECTION_HEADING_CLASS,
  ADMIN_SELECT_TRIGGER_CLASS,
  ADMIN_TABLE_CLAMP_CLASS,
  ADMIN_TABLE_FILTERS_COMPACT_CLASS,
  ADMIN_TABLE_FOOTER_CLASS,
  ADMIN_TABLE_PANEL_CLASS,
  ADMIN_TABLE_SEARCH_ICON_CLASS,
  ADMIN_TABLE_SCROLLER_CLASS,
  ADMIN_TOOLBAR_PANEL_CLASS
} from "@/components/admin/admin-tailwind";
import type { AdminUserRow, AdminUsersSortDirection, AdminUsersSortField } from "@/lib/admin-users";

type AdminUsersTableProps = {
  users: AdminUserRow[];
  total: number;
  page: number;
  pageSize: number;
  statusCounts: {
    total: number;
    active: number;
    inactive: number;
  };
  filters: {
    query: string;
    role: string;
    status: string;
    sort: AdminUsersSortField;
    dir: AdminUsersSortDirection;
  };
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const SEARCH_DEBOUNCE_MS = 280;
const SORTABLE_COLUMNS: ReadonlySet<AdminUsersSortField> = new Set(["createdAt", "username", "role", "status"]);

function getStatusColor(isActive: boolean) {
  return isActive ? ("success" as const) : ("default" as const);
}

function getStatusLabel(isActive: boolean) {
  return isActive ? "Active" : "Inactive";
}

function formatRole(role: AdminUserRow["role"]) {
  switch (role) {
    case "ADMINISTRATOR":
      return "Administrator";
    case "OWNER":
      return "Owner";
    default:
      return "Subscriber";
  }
}

function getRoleColor(role: AdminUserRow["role"]) {
  switch (role) {
    case "ADMINISTRATOR":
      return "primary" as const;
    case "OWNER":
      return "warning" as const;
    default:
      return "default" as const;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function AdminUsersTable({
  users,
  total,
  page,
  pageSize,
  statusCounts,
  filters
}: AdminUsersTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [queryInput, setQueryInput] = useState(filters.query);
  const requestedQueryRef = useRef(filters.query);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const sortDescriptor: SortDescriptor = {
    column: filters.sort,
    direction: filters.dir
  };

  useEffect(() => {
    setQueryInput(filters.query);
    requestedQueryRef.current = filters.query;
  }, [filters.query]);

  const updateFilters = useCallback(
    (next: Partial<AdminUsersTableProps["filters"] & { page?: number; pageSize?: number }>) => {
      const params = new URLSearchParams(searchParams.toString());

      const nextPage = next.page ?? 1;
      const nextPageSize = next.pageSize ?? pageSize;
      const nextQuery = next.query ?? queryInput;
      const nextRole = next.role ?? filters.role;
      const nextStatus = next.status ?? filters.status;
      const nextSort = next.sort ?? filters.sort;
      const nextDir = next.dir ?? filters.dir;

      requestedQueryRef.current = nextQuery;

      if (nextQuery) {
        params.set("q", nextQuery);
      } else {
        params.delete("q");
      }

      if (nextRole !== "all") {
        params.set("role", nextRole);
      } else {
        params.delete("role");
      }

      if (nextStatus !== "all") {
        params.set("status", nextStatus);
      } else {
        params.delete("status");
      }

      if (nextSort !== "createdAt") {
        params.set("sort", nextSort);
      } else {
        params.delete("sort");
      }

      if (nextDir !== "descending") {
        params.set("dir", nextDir);
      } else {
        params.delete("dir");
      }

      if (nextPage > 1) {
        params.set("page", String(nextPage));
      } else {
        params.delete("page");
      }

      if (nextPageSize !== 25) {
        params.set("pageSize", String(nextPageSize));
      } else {
        params.delete("pageSize");
      }

      startTransition(() => {
        router.replace(params.toString().length > 0 ? `${pathname}?${params.toString()}` : pathname, {
          scroll: false
        });
      });
    },
    [filters.dir, filters.role, filters.sort, filters.status, pageSize, pathname, queryInput, router, searchParams]
  );

  useEffect(() => {
    if (queryInput === filters.query || queryInput === requestedQueryRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      updateFilters({ query: queryInput, page: 1 });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [filters.query, queryInput, updateFilters]);

  function handleSortChange(descriptor: SortDescriptor) {
    const nextColumn = typeof descriptor.column === "string" ? descriptor.column : String(descriptor.column);

    if (!SORTABLE_COLUMNS.has(nextColumn as AdminUsersSortField)) {
      return;
    }

    updateFilters({
      sort: nextColumn as AdminUsersSortField,
      dir: descriptor.direction === "ascending" ? "ascending" : "descending",
      page: 1
    });
  }

  return (
    <>
      <section className={ADMIN_TOOLBAR_PANEL_CLASS}>
        <div className={ADMIN_HEADER_ROW_DENSE_CLASS}>
          <div>
            <h2 className={ADMIN_SECTION_HEADING_CLASS}>Overview</h2>
          </div>
          <div className={ADMIN_METRICS_CLASS}>
            <Chip radius="sm" size="sm" variant="flat">Total {statusCounts.total}</Chip>
            <Chip color="success" radius="sm" size="sm" variant="flat">Active {statusCounts.active}</Chip>
            <Chip radius="sm" size="sm" variant="flat">Inactive {statusCounts.inactive}</Chip>
          </div>
        </div>

        <div className={ADMIN_TABLE_FILTERS_COMPACT_CLASS}>
          <Input
            aria-label="Search users"
            classNames={{ inputWrapper: "!shadow-none" }}
            isClearable
            placeholder="Search username or email"
            radius="lg"
            size="lg"
            startContent={<SearchLinearIcon aria-hidden="true" className={ADMIN_TABLE_SEARCH_ICON_CLASS} height={18} width={18} />}
            value={queryInput}
            variant="bordered"
            onClear={() => {
              setQueryInput("");
            }}
            onValueChange={(value) => {
              setQueryInput(value);
            }}
          />
          <Select
            aria-label="Filter users by role"
            classNames={{ trigger: ADMIN_SELECT_TRIGGER_CLASS }}
            disallowEmptySelection
            radius="lg"
            selectedKeys={new Set([filters.role])}
            size="lg"
            variant="bordered"
            onSelectionChange={(keys) => {
              const nextValue = keys instanceof Set ? String(keys.values().next().value ?? "all") : "all";
              updateFilters({ role: nextValue, page: 1 });
            }}
          >
            <SelectItem key="all">All roles</SelectItem>
            <SelectItem key="ADMINISTRATOR">Administrators</SelectItem>
            <SelectItem key="OWNER">Owners</SelectItem>
            <SelectItem key="SUBSCRIBER">Subscribers</SelectItem>
          </Select>
          <Select
            aria-label="Filter users by status"
            classNames={{ trigger: ADMIN_SELECT_TRIGGER_CLASS }}
            disallowEmptySelection
            radius="lg"
            selectedKeys={new Set([filters.status])}
            size="lg"
            variant="bordered"
            onSelectionChange={(keys) => {
              const nextValue = keys instanceof Set ? String(keys.values().next().value ?? "all") : "all";
              updateFilters({ status: nextValue, page: 1 });
            }}
          >
            <SelectItem key="all">All statuses</SelectItem>
            <SelectItem key="active">Active</SelectItem>
            <SelectItem key="inactive">Inactive</SelectItem>
          </Select>
          <Select
            aria-label="Rows per page"
            classNames={{ trigger: ADMIN_SELECT_TRIGGER_CLASS }}
            disallowEmptySelection
            radius="lg"
            selectedKeys={new Set([String(pageSize)])}
            size="lg"
            variant="bordered"
            onSelectionChange={(keys) => {
              const nextValue = keys instanceof Set ? String(keys.values().next().value ?? pageSize) : String(pageSize);
              const parsed = Number(nextValue);
              if (!Number.isFinite(parsed)) {
                return;
              }

              updateFilters({ pageSize: parsed, page: 1 });
            }}
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <SelectItem key={String(option)}>{`Show ${option}`}</SelectItem>
            ))}
          </Select>
        </div>
      </section>

      <section className={ADMIN_TABLE_PANEL_CLASS}>
        <div className={ADMIN_TABLE_SCROLLER_CLASS}>
          <Table
            aria-label="Users table"
            classNames={{
              base: "adminDataTable",
              table: "adminDataTableTable adminUsersDataTableTable",
              th: "adminDataTableHeadCell",
              td: "adminDataTableCell",
              tr: "adminDataTableRow"
            }}
            removeWrapper
            shadow="none"
            sortDescriptor={sortDescriptor}
            onSortChange={handleSortChange}
            onRowAction={(key) => {
              const user = users.find((item) => item.id === key);
              if (!user) {
                return;
              }

              router.push(`/admin/users/${user.id}/edit`);
            }}
          >
            <TableHeader>
              <TableColumn key="username" allowsSorting isRowHeader>
                User
              </TableColumn>
              <TableColumn key="role" allowsSorting>
                Role
              </TableColumn>
              <TableColumn key="status" allowsSorting>
                Status
              </TableColumn>
              <TableColumn key="email">Email</TableColumn>
              <TableColumn key="createdAt" allowsSorting>
                Created
              </TableColumn>
            </TableHeader>
            <TableBody emptyContent={isPending ? "Updating users..." : "No users match the current filters."} items={users}>
              {(user) => (
                <TableRow key={user.id} textValue={`${user.username} ${user.email}`}>
                  <TableCell>
                    <div className="adminListingPrimaryCell">
                      <strong>{user.username}</strong>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip color={getRoleColor(user.role)} radius="sm" size="sm" variant="flat">
                      {formatRole(user.role)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="adminListingStatusCell">
                      <Chip color={getStatusColor(user.isActive)} radius="sm" size="sm" variant="flat">
                        {getStatusLabel(user.isActive)}
                      </Chip>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={ADMIN_TABLE_CLAMP_CLASS}>{user.email}</span>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className={ADMIN_TABLE_FOOTER_CLASS}>
          <p className="muted">
            Showing {total === 0 ? 0 : (page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total} users
          </p>
          <Pagination page={page} total={totalPages} onChange={(nextPage) => updateFilters({ page: nextPage })} />
        </div>
      </section>
    </>
  );
}
