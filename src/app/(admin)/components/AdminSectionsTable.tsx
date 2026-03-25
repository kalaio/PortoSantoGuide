"use client";

import { SearchMd } from "@untitledui/icons";
import { type Key, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AdminPagination from "@/app/(admin)/components/AdminPagination";
import { Table } from "@/components/application/table/table";
import {
  ADMIN_HEADER_ROW_DENSE_CLASS,
  ADMIN_METRICS_CLASS,
  ADMIN_SECTION_HEADING_CLASS,
  ADMIN_TABLE_FILTERS_CLASS,
  ADMIN_TABLE_FOOTER_CLASS,
  ADMIN_TABLE_PANEL_CLASS,
  ADMIN_TOOLBAR_PANEL_CLASS
} from "@/app/(admin)/components/admin-tailwind";
import { Badge, SelectInput, TextInput } from "@/components/ui";
import type { AdminSectionRow, AdminSectionsSortDirection, AdminSectionsSortField } from "../lib/admin-sections";

type AdminSectionsTableProps = {
  sections: AdminSectionRow[];
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
    status: string;
    sort: AdminSectionsSortField;
    dir: AdminSectionsSortDirection;
  };
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const SEARCH_DEBOUNCE_MS = 280;
const TABLE_COLUMNS = [
  { id: "label", label: "Section", sortable: true },
  { id: "status", label: "Status", sortable: true },
  { id: "sortOrder", label: "Order", sortable: true },
  { id: "updatedAt", label: "Updated", sortable: true }
] as const satisfies ReadonlyArray<{ id: string; label: string; sortable: boolean }>;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function AdminSectionsTable({ sections, total, page, pageSize, statusCounts, filters }: AdminSectionsTableProps) {
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

  const updateFilters = useCallback(
    (next: Partial<AdminSectionsTableProps["filters"] & { page?: number; pageSize?: number }>) => {
      const params = new URLSearchParams(searchParams.toString());
      const nextPage = next.page ?? 1;
      const nextPageSize = next.pageSize ?? pageSize;
      const nextQuery = next.query ?? queryInput;
      const nextStatus = next.status ?? filters.status;
      const nextSort = next.sort ?? filters.sort;
      const nextDir = next.dir ?? filters.dir;

      requestedQueryRef.current = nextQuery;

      if (nextQuery) params.set("q", nextQuery);
      else params.delete("q");
      if (nextStatus !== "all") params.set("status", nextStatus);
      else params.delete("status");
      if (nextSort !== "sortOrder") params.set("sort", nextSort);
      else params.delete("sort");
      if (nextDir !== "ascending") params.set("dir", nextDir);
      else params.delete("dir");
      if (nextPage > 1) params.set("page", String(nextPage));
      else params.delete("page");
      if (nextPageSize !== 25) params.set("pageSize", String(nextPageSize));
      else params.delete("pageSize");

      startTransition(() => {
        router.replace(params.toString().length > 0 ? `${pathname}?${params.toString()}` : pathname, {
          scroll: false
        });
      });
    },
    [filters.dir, filters.sort, filters.status, pageSize, pathname, queryInput, router, searchParams]
  );

  useEffect(() => {
    if (queryInput === filters.query || queryInput === requestedQueryRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => updateFilters({ query: queryInput, page: 1 }), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timeoutId);
  }, [filters.query, queryInput, updateFilters]);

  function handleSortChange(sortDescriptor: { column: Key; direction: "ascending" | "descending" }) {
    updateFilters({
      sort: sortDescriptor.column as AdminSectionsSortField,
      dir: sortDescriptor.direction,
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
            <Badge>Total {statusCounts.total}</Badge>
            <Badge tone="success">Active {statusCounts.active}</Badge>
            <Badge>Inactive {statusCounts.inactive}</Badge>
          </div>
        </div>

        <div className={ADMIN_TABLE_FILTERS_CLASS}>
          <TextInput
            aria-label="Search sections"
            icon={SearchMd}
            placeholder="Search label or slug"
            value={queryInput}
            onChange={setQueryInput}
          />
          <SelectInput aria-label="Filter by status" value={filters.status} onChange={(event) => updateFilters({ status: event.target.value, page: 1 })}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </SelectInput>
          <SelectInput aria-label="Rows per page" value={String(pageSize)} onChange={(event) => updateFilters({ pageSize: Number(event.target.value), page: 1 })}>
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>{`Show ${option}`}</option>
            ))}
          </SelectInput>
        </div>
      </section>

      <section className={ADMIN_TABLE_PANEL_CLASS}>
        <Table
          aria-label="Sections"
          className="min-w-[760px]"
          sortDescriptor={{ column: filters.sort, direction: filters.dir }}
          onSortChange={handleSortChange}
          onRowAction={(key) => router.push(`/admin/sections/${String(key)}/edit`)}
        >
          <Table.Header columns={TABLE_COLUMNS}>
            {(column) => <Table.Head id={column.id} label={column.label} allowsSorting={column.sortable} isRowHeader={column.id === "label"} />}
          </Table.Header>
          <Table.Body
            items={sections}
            renderEmptyState={() => <div className="px-6 py-6 text-sm text-tertiary">{isPending ? "Updating sections..." : "No sections match the current filters."}</div>}
          >
            {(section) => (
              <Table.Row id={section.id} onRowClick={() => router.push(`/admin/sections/${section.id}/edit`)}>
                <Table.Cell>
                  <div className="adminListingPrimaryCell">
                    <strong className="text-primary">{section.label}</strong>
                    <span className="muted">{section.slug}</span>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Badge tone={section.isActive ? "success" : "neutral"}>{section.isActive ? "Active" : "Inactive"}</Badge>
                </Table.Cell>
                <Table.Cell>{section.sortOrder}</Table.Cell>
                <Table.Cell>{section.updatedAtLabel}</Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>

        <div className={ADMIN_TABLE_FOOTER_CLASS}>
          <p className="muted">Showing {total === 0 ? 0 : (page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total} sections</p>
          <AdminPagination page={page} total={totalPages} onChange={(nextPage) => updateFilters({ page: nextPage })} />
        </div>
      </section>
    </>
  );
}
