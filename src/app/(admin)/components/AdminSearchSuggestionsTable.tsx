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
  ADMIN_TABLE_CLAMP_CLASS,
  ADMIN_TABLE_FILTERS_CLASS,
  ADMIN_TABLE_FOOTER_CLASS,
  ADMIN_TABLE_PANEL_CLASS,
  ADMIN_TOOLBAR_PANEL_CLASS
} from "@/app/(admin)/components/admin-tailwind";
import { Badge, SelectInput, TextInput } from "@/components/ui";
import type {
  AdminSearchSuggestionRow,
  AdminSearchSuggestionsSortDirection,
  AdminSearchSuggestionsSortField
} from "@/lib/admin-search-suggestions";

type AdminSearchSuggestionsTableProps = {
  suggestions: AdminSearchSuggestionRow[];
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
    sort: AdminSearchSuggestionsSortField;
    dir: AdminSearchSuggestionsSortDirection;
  };
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const SEARCH_DEBOUNCE_MS = 280;
const TABLE_COLUMNS = [
  { id: "label", label: "Suggestion", sortable: true },
  { id: "status", label: "Status", sortable: true },
  { id: "priority", label: "Priority", sortable: true },
  { id: "updatedAt", label: "Updated", sortable: true }
] as const satisfies ReadonlyArray<{ id: string; label: string; sortable: boolean }>;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function AdminSearchSuggestionsTable({
  suggestions,
  total,
  page,
  pageSize,
  statusCounts,
  filters
}: AdminSearchSuggestionsTableProps) {
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
    (next: Partial<AdminSearchSuggestionsTableProps["filters"] & { page?: number; pageSize?: number }>) => {
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
      if (nextSort !== "priority") params.set("sort", nextSort);
      else params.delete("sort");
      if (nextDir !== "descending") params.set("dir", nextDir);
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
    const column = sortDescriptor.column as AdminSearchSuggestionsSortField;
    const nextDirection = filters.sort !== column && column === "priority" ? "descending" : sortDescriptor.direction;

    updateFilters({
      sort: column,
      dir: nextDirection,
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
            aria-label="Search suggestions"
            icon={SearchMd}
            placeholder="Search label or query"
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
          aria-label="Search suggestions"
          className="min-w-[860px]"
          sortDescriptor={{ column: filters.sort, direction: filters.dir }}
          onSortChange={handleSortChange}
          onRowAction={(key) => router.push(`/admin/search-suggestions/${String(key)}/edit`)}
        >
          <Table.Header columns={TABLE_COLUMNS}>
            {(column) => <Table.Head id={column.id} label={column.label} allowsSorting={column.sortable} isRowHeader={column.id === "label"} />}
          </Table.Header>
          <Table.Body
            items={suggestions}
            renderEmptyState={() => <div className="px-6 py-6 text-sm text-tertiary">{isPending ? "Updating suggestions..." : "No search suggestions match the current filters."}</div>}
          >
            {(suggestion) => (
              <Table.Row id={suggestion.id} onRowClick={() => router.push(`/admin/search-suggestions/${suggestion.id}/edit`)}>
                <Table.Cell>
                  <div className="adminListingPrimaryCell">
                    <strong className="text-primary">{suggestion.label}</strong>
                    <span className={`muted ${ADMIN_TABLE_CLAMP_CLASS}`}>{suggestion.query}</span>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Badge tone={suggestion.isActive ? "success" : "neutral"}>{suggestion.isActive ? "Active" : "Inactive"}</Badge>
                </Table.Cell>
                <Table.Cell>{suggestion.priority}</Table.Cell>
                <Table.Cell>{suggestion.updatedAtLabel}</Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>

        <div className={ADMIN_TABLE_FOOTER_CLASS}>
          <p className="muted">Showing {total === 0 ? 0 : (page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total} suggestions</p>
          <AdminPagination page={page} total={totalPages} onChange={(nextPage) => updateFilters({ page: nextPage })} />
        </div>
      </section>
    </>
  );
}
