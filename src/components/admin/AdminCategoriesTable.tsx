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
  ADMIN_TABLE_FILTERS_CLASS,
  ADMIN_TABLE_FOOTER_CLASS,
  ADMIN_TABLE_PANEL_CLASS,
  ADMIN_TABLE_SCROLLER_CLASS,
  ADMIN_TOOLBAR_PANEL_CLASS
} from "@/components/admin/admin-tailwind";
import { Badge, SelectInput, TextInput } from "@/components/ui";
import type {
  AdminCategoriesSortDirection,
  AdminCategoriesSortField,
  AdminCategoryFilterOption,
  AdminCategoryRow
} from "@/lib/admin-categories";

type AdminCategoriesTableProps = {
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
  filters: {
    query: string;
    status: string;
    section: string;
    schema: string;
    sort: AdminCategoriesSortField;
    dir: AdminCategoriesSortDirection;
  };
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const SEARCH_DEBOUNCE_MS = 280;
const SORTABLE_COLUMNS: ReadonlySet<AdminCategoriesSortField> = new Set(["updatedAt", "label", "status", "sortOrder"]);

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function getNextSortDirection(
  currentSort: AdminCategoriesSortField,
  currentDir: AdminCategoriesSortDirection,
  column: AdminCategoriesSortField
) {
  if (currentSort !== column) {
    return "ascending";
  }

  return currentDir === "ascending" ? "descending" : "ascending";
}

function SortableHeader({
  label,
  column,
  activeSort,
  activeDir,
  onSort
}: {
  label: string;
  column: AdminCategoriesSortField;
  activeSort: AdminCategoriesSortField;
  activeDir: AdminCategoriesSortDirection;
  onSort: (column: AdminCategoriesSortField) => void;
}) {
  const isActive = activeSort === column;

  return (
    <button type="button" className="inline-flex items-center gap-1 font-inherit" onClick={() => onSort(column)}>
      <span>{label}</span>
      <span aria-hidden="true">{isActive ? (activeDir === "ascending" ? "↑" : "↓") : "↕"}</span>
    </button>
  );
}

export default function AdminCategoriesTable({
  categories,
  total,
  page,
  pageSize,
  statusCounts,
  sectionOptions,
  schemaOptions,
  hasUnassignedSchema,
  filters
}: AdminCategoriesTableProps) {
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
    (next: Partial<AdminCategoriesTableProps["filters"] & { page?: number; pageSize?: number }>) => {
      const params = new URLSearchParams(searchParams.toString());
      const nextPage = next.page ?? 1;
      const nextPageSize = next.pageSize ?? pageSize;
      const nextQuery = next.query ?? queryInput;
      const nextStatus = next.status ?? filters.status;
      const nextSection = next.section ?? filters.section;
      const nextSchema = next.schema ?? filters.schema;
      const nextSort = next.sort ?? filters.sort;
      const nextDir = next.dir ?? filters.dir;

      requestedQueryRef.current = nextQuery;

      if (nextQuery) params.set("q", nextQuery);
      else params.delete("q");
      if (nextStatus !== "all") params.set("status", nextStatus);
      else params.delete("status");
      if (nextSection !== "all") params.set("section", nextSection);
      else params.delete("section");
      if (nextSchema !== "all") params.set("schema", nextSchema);
      else params.delete("schema");
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
    [filters.dir, filters.schema, filters.section, filters.sort, filters.status, pageSize, pathname, queryInput, router, searchParams]
  );

  useEffect(() => {
    if (queryInput === filters.query || queryInput === requestedQueryRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => updateFilters({ query: queryInput, page: 1 }), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timeoutId);
  }, [filters.query, queryInput, updateFilters]);

  function handleSortChange(column: AdminCategoriesSortField) {
    if (!SORTABLE_COLUMNS.has(column)) {
      return;
    }

    updateFilters({
      sort: column,
      dir: getNextSortDirection(filters.sort, filters.dir, column),
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
            aria-label="Search categories"
            icon={SearchMd}
            placeholder="Search label, slug, section, schema, or icon"
            value={queryInput}
            onChange={setQueryInput}
          />
          <SelectInput aria-label="Filter by schema" value={filters.schema} onChange={(event) => updateFilters({ schema: event.target.value, page: 1 })}>
            <option value="all">All schemas</option>
            {hasUnassignedSchema ? <option value="none">No schema</option> : null}
            {schemaOptions.map((schema) => (
              <option key={schema.value} value={schema.value}>{schema.label}</option>
            ))}
          </SelectInput>
          <SelectInput aria-label="Filter by section" value={filters.section} onChange={(event) => updateFilters({ section: event.target.value, page: 1 })}>
            <option value="all">All sections</option>
            {sectionOptions.map((section) => (
              <option key={section.value} value={section.value}>{section.label}</option>
            ))}
          </SelectInput>
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
        <div className={ADMIN_TABLE_SCROLLER_CLASS}>
          <table className="adminDataTableTable adminCategoriesDataTableTable w-full min-w-[980px] border-collapse">
            <thead>
              <tr>
                <th className="adminDataTableHeadCell text-left"><SortableHeader label="Category" column="label" activeSort={filters.sort} activeDir={filters.dir} onSort={handleSortChange} /></th>
                <th className="adminDataTableHeadCell text-left"><SortableHeader label="Status" column="status" activeSort={filters.sort} activeDir={filters.dir} onSort={handleSortChange} /></th>
                <th className="adminDataTableHeadCell text-left">Section</th>
                <th className="adminDataTableHeadCell text-left">Schema</th>
                <th className="adminDataTableHeadCell text-left">Icon</th>
                <th className="adminDataTableHeadCell text-left"><SortableHeader label="Order" column="sortOrder" activeSort={filters.sort} activeDir={filters.dir} onSort={handleSortChange} /></th>
                <th className="adminDataTableHeadCell text-left"><SortableHeader label="Updated" column="updatedAt" activeSort={filters.sort} activeDir={filters.dir} onSort={handleSortChange} /></th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td className="adminDataTableCell px-4 py-6 text-[color:var(--admin-muted)]" colSpan={7}>{isPending ? "Updating categories..." : "No categories match the current filters."}</td>
                </tr>
              ) : (
                categories.map((category, index) => (
                  <tr
                    key={category.id}
                    className="adminDataTableRow"
                    data-last={index === categories.length - 1 ? "true" : undefined}
                    tabIndex={0}
                    onClick={() => router.push(`/admin/categories/${category.id}/edit`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(`/admin/categories/${category.id}/edit`);
                      }
                    }}
                  >
                    <td className="adminDataTableCell px-4 py-4"><div className="adminListingPrimaryCell"><strong>{category.label}</strong><span className="muted">{category.slug}</span></div></td>
                    <td className="adminDataTableCell px-4 py-4"><Badge tone={category.isActive ? "success" : "neutral"}>{category.isActive ? "Active" : "Inactive"}</Badge></td>
                    <td className="adminDataTableCell px-4 py-4">{category.section.label}</td>
                    <td className="adminDataTableCell px-4 py-4">{category.schema?.label ?? "No schema"}</td>
                    <td className="adminDataTableCell px-4 py-4"><span className={ADMIN_TABLE_CLAMP_CLASS}>{category.iconName ?? "-"}</span></td>
                    <td className="adminDataTableCell px-4 py-4">{category.sortOrder}</td>
                    <td className="adminDataTableCell px-4 py-4">{formatDate(category.updatedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={ADMIN_TABLE_FOOTER_CLASS}>
          <p className="muted">Showing {total === 0 ? 0 : (page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total} categories</p>
          <AdminPagination page={page} total={totalPages} onChange={(nextPage) => updateFilters({ page: nextPage })} />
        </div>
      </section>
    </>
  );
}
