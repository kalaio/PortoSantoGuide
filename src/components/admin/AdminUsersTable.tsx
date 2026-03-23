"use client";

import { SearchMd } from "@untitledui/icons";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AdminPagination from "@/components/admin/AdminPagination";
import {
  ADMIN_HEADER_ROW_DENSE_CLASS,
  ADMIN_METRICS_CLASS,
  ADMIN_SECTION_HEADING_CLASS,
  ADMIN_TABLE_CLAMP_CLASS,
  ADMIN_TABLE_FILTERS_COMPACT_CLASS,
  ADMIN_TABLE_FOOTER_CLASS,
  ADMIN_TABLE_PANEL_CLASS,
  ADMIN_TABLE_SCROLLER_CLASS,
  ADMIN_TOOLBAR_PANEL_CLASS
} from "@/components/admin/admin-tailwind";
import { Badge, SelectInput, TextInput } from "@/components/ui";
import type { AdminUserRow, AdminUsersSortDirection, AdminUsersSortField } from "@/lib/admin-users";

type AdminUsersTableProps = {
  users: AdminUserRow[];
  total: number;
  page: number;
  pageSize: number;
  statusCounts: { total: number; active: number; inactive: number };
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

function formatRole(role: AdminUserRow["role"]) {
  switch (role) {
    case "ADMINISTRATOR": return "Administrator";
    case "OWNER": return "Owner";
    default: return "Subscriber";
  }
}

function getRoleTone(role: AdminUserRow["role"]) {
  switch (role) {
    case "ADMINISTRATOR": return "primary" as const;
    case "OWNER": return "warning" as const;
    default: return "neutral" as const;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function getNextSortDirection(currentSort: AdminUsersSortField, currentDir: AdminUsersSortDirection, column: AdminUsersSortField) {
  if (currentSort !== column) return column === "createdAt" ? "descending" : "ascending";
  return currentDir === "ascending" ? "descending" : "ascending";
}

function SortableHeader({ label, column, activeSort, activeDir, onSort }: { label: string; column: AdminUsersSortField; activeSort: AdminUsersSortField; activeDir: AdminUsersSortDirection; onSort: (column: AdminUsersSortField) => void }) {
  const isActive = activeSort === column;
  return <button type="button" className="inline-flex items-center gap-1 font-inherit" onClick={() => onSort(column)}><span>{label}</span><span aria-hidden="true">{isActive ? (activeDir === "ascending" ? "↑" : "↓") : "↕"}</span></button>;
}

export default function AdminUsersTable({ users, total, page, pageSize, statusCounts, filters }: AdminUsersTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [queryInput, setQueryInput] = useState(filters.query);
  const requestedQueryRef = useRef(filters.query);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setQueryInput(filters.query);
    requestedQueryRef.current = filters.query;
  }, [filters.query]);

  const updateFilters = useCallback((next: Partial<AdminUsersTableProps["filters"] & { page?: number; pageSize?: number }>) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextPage = next.page ?? 1;
    const nextPageSize = next.pageSize ?? pageSize;
    const nextQuery = next.query ?? queryInput;
    const nextRole = next.role ?? filters.role;
    const nextStatus = next.status ?? filters.status;
    const nextSort = next.sort ?? filters.sort;
    const nextDir = next.dir ?? filters.dir;

    requestedQueryRef.current = nextQuery;
    if (nextQuery) params.set("q", nextQuery);
    else params.delete("q");
    if (nextRole !== "all") params.set("role", nextRole);
    else params.delete("role");
    if (nextStatus !== "all") params.set("status", nextStatus);
    else params.delete("status");
    if (nextSort !== "createdAt") params.set("sort", nextSort);
    else params.delete("sort");
    if (nextDir !== "descending") params.set("dir", nextDir);
    else params.delete("dir");
    if (nextPage > 1) params.set("page", String(nextPage));
    else params.delete("page");
    if (nextPageSize !== 25) params.set("pageSize", String(nextPageSize));
    else params.delete("pageSize");

    startTransition(() => {
      router.replace(params.toString().length > 0 ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
    });
  }, [filters.dir, filters.role, filters.sort, filters.status, pageSize, pathname, queryInput, router, searchParams]);

  useEffect(() => {
    if (queryInput === filters.query || queryInput === requestedQueryRef.current) return;
    const timeoutId = window.setTimeout(() => updateFilters({ query: queryInput, page: 1 }), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timeoutId);
  }, [filters.query, queryInput, updateFilters]);

  function handleSortChange(column: AdminUsersSortField) {
    if (!SORTABLE_COLUMNS.has(column)) return;
    updateFilters({ sort: column, dir: getNextSortDirection(filters.sort, filters.dir, column), page: 1 });
  }

  return (
    <>
      <section className={ADMIN_TOOLBAR_PANEL_CLASS}>
        <div className={ADMIN_HEADER_ROW_DENSE_CLASS}><div><h2 className={ADMIN_SECTION_HEADING_CLASS}>Overview</h2></div><div className={ADMIN_METRICS_CLASS}><Badge>Total {statusCounts.total}</Badge><Badge tone="success">Active {statusCounts.active}</Badge><Badge>Inactive {statusCounts.inactive}</Badge></div></div>
        <div className={ADMIN_TABLE_FILTERS_COMPACT_CLASS}>
          <TextInput aria-label="Search users" icon={SearchMd} placeholder="Search username or email" value={queryInput} onChange={setQueryInput} />
          <SelectInput aria-label="Filter by role" value={filters.role} onChange={(event) => updateFilters({ role: event.target.value, page: 1 })}><option value="all">All roles</option><option value="ADMINISTRATOR">Administrators</option><option value="OWNER">Owners</option><option value="SUBSCRIBER">Subscribers</option></SelectInput>
          <SelectInput aria-label="Filter by status" value={filters.status} onChange={(event) => updateFilters({ status: event.target.value, page: 1 })}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></SelectInput>
          <SelectInput aria-label="Rows per page" value={String(pageSize)} onChange={(event) => updateFilters({ pageSize: Number(event.target.value), page: 1 })}>{PAGE_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{`Show ${option}`}</option>)}</SelectInput>
        </div>
      </section>

      <section className={ADMIN_TABLE_PANEL_CLASS}>
        <div className={ADMIN_TABLE_SCROLLER_CLASS}>
          <table className="adminDataTableTable adminUsersDataTableTable w-full min-w-[860px] border-collapse">
            <thead><tr><th className="adminDataTableHeadCell text-left"><SortableHeader label="User" column="username" activeSort={filters.sort} activeDir={filters.dir} onSort={handleSortChange} /></th><th className="adminDataTableHeadCell text-left"><SortableHeader label="Role" column="role" activeSort={filters.sort} activeDir={filters.dir} onSort={handleSortChange} /></th><th className="adminDataTableHeadCell text-left"><SortableHeader label="Status" column="status" activeSort={filters.sort} activeDir={filters.dir} onSort={handleSortChange} /></th><th className="adminDataTableHeadCell text-left">Email</th><th className="adminDataTableHeadCell text-left"><SortableHeader label="Created" column="createdAt" activeSort={filters.sort} activeDir={filters.dir} onSort={handleSortChange} /></th></tr></thead>
            <tbody>
              {users.length === 0 ? <tr><td className="adminDataTableCell px-4 py-6 text-[color:var(--admin-muted)]" colSpan={5}>{isPending ? "Updating users..." : "No users match the current filters."}</td></tr> : users.map((user, index) => <tr key={user.id} className="adminDataTableRow" data-last={index === users.length - 1 ? "true" : undefined} tabIndex={0} onClick={() => router.push(`/admin/users/${user.id}/edit`)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); router.push(`/admin/users/${user.id}/edit`); } }}><td className="adminDataTableCell px-4 py-4"><div className="adminListingPrimaryCell"><strong>{user.username}</strong></div></td><td className="adminDataTableCell px-4 py-4"><Badge tone={getRoleTone(user.role)}>{formatRole(user.role)}</Badge></td><td className="adminDataTableCell px-4 py-4"><Badge tone={user.isActive ? "success" : "neutral"}>{user.isActive ? "Active" : "Inactive"}</Badge></td><td className="adminDataTableCell px-4 py-4"><span className={ADMIN_TABLE_CLAMP_CLASS}>{user.email}</span></td><td className="adminDataTableCell px-4 py-4">{formatDate(user.createdAt)}</td></tr>)}
            </tbody>
          </table>
        </div>
        <div className={ADMIN_TABLE_FOOTER_CLASS}><p className="muted">Showing {total === 0 ? 0 : (page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total} users</p><AdminPagination page={page} total={totalPages} onChange={(nextPage) => updateFilters({ page: nextPage })} /></div>
      </section>
    </>
  );
}
