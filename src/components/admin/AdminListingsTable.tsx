"use client";

import { SearchMd } from "@untitledui/icons";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AdminPagination from "@/components/admin/AdminPagination";
import {
  ADMIN_HEADER_ROW_DENSE_CLASS,
  ADMIN_DRAFT_CHIP_CLASS,
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
import type { AdminListingRow, AdminListingsSortDirection, AdminListingsSortField } from "@/lib/admin-listings";

type AdminListingsTableProps = {
  listings: AdminListingRow[];
  total: number;
  page: number;
  pageSize: number;
  statusCounts: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };
  sectionOptions: string[];
  categoryOptions: string[];
  filters: {
    query: string;
    status: string;
    section: string;
    category: string;
    sort: AdminListingsSortField;
    dir: AdminListingsSortDirection;
  };
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const SEARCH_DEBOUNCE_MS = 280;
const SORTABLE_COLUMNS: ReadonlySet<AdminListingsSortField> = new Set(["updatedAt", "title", "status"]);

function getStatusTone(status: AdminListingRow["status"]) {
  switch (status) {
    case "PUBLISHED":
      return "success" as const;
    case "ARCHIVED":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

function getStatusLabel(status: AdminListingRow["status"]) {
  switch (status) {
    case "PUBLISHED":
      return "Published";
    case "ARCHIVED":
      return "Archived";
    default:
      return "Draft";
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function getNextSortDirection(
  currentSort: AdminListingsSortField,
  currentDir: AdminListingsSortDirection,
  column: AdminListingsSortField
) {
  if (currentSort !== column) {
    return column === "updatedAt" ? "descending" : "ascending";
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
  column: AdminListingsSortField;
  activeSort: AdminListingsSortField;
  activeDir: AdminListingsSortDirection;
  onSort: (column: AdminListingsSortField) => void;
}) {
  const isActive = activeSort === column;

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 font-inherit"
      onClick={() => onSort(column)}
    >
      <span>{label}</span>
      <span aria-hidden="true">{isActive ? (activeDir === "ascending" ? "↑" : "↓") : "↕"}</span>
    </button>
  );
}

export default function AdminListingsTable({
  listings,
  total,
  page,
  pageSize,
  statusCounts,
  sectionOptions,
  categoryOptions,
  filters
}: AdminListingsTableProps) {
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
    (next: Partial<AdminListingsTableProps["filters"] & { page?: number; pageSize?: number }>) => {
      const params = new URLSearchParams(searchParams.toString());

      const nextPage = next.page ?? 1;
      const nextPageSize = next.pageSize ?? pageSize;
      const nextQuery = next.query ?? queryInput;
      const nextStatus = next.status ?? filters.status;
      const nextSection = next.section ?? filters.section;
      const nextCategory = next.category ?? filters.category;
      const nextSort = next.sort ?? filters.sort;
      const nextDir = next.dir ?? filters.dir;

      requestedQueryRef.current = nextQuery;

      if (nextQuery) params.set("q", nextQuery);
      else params.delete("q");
      if (nextStatus !== "all") params.set("status", nextStatus);
      else params.delete("status");
      if (nextSection !== "all") params.set("section", nextSection);
      else params.delete("section");
      if (nextCategory !== "all") params.set("category", nextCategory);
      else params.delete("category");
      if (nextSort !== "updatedAt") params.set("sort", nextSort);
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
    [filters.category, filters.dir, filters.section, filters.sort, filters.status, pageSize, pathname, queryInput, router, searchParams]
  );

  useEffect(() => {
    if (queryInput === filters.query || queryInput === requestedQueryRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      updateFilters({ query: queryInput, page: 1 });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [filters.query, queryInput, updateFilters]);

  function handleSortChange(column: AdminListingsSortField) {
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
            <Badge tone="success">Published {statusCounts.published}</Badge>
            <Badge>Draft {statusCounts.draft}</Badge>
            <Badge tone="warning">Archived {statusCounts.archived}</Badge>
          </div>
        </div>

        <div className={ADMIN_TABLE_FILTERS_CLASS}>
          <TextInput
            aria-label="Search listings"
            icon={SearchMd}
            placeholder="Search title, slug, section, or category"
            value={queryInput}
            onChange={setQueryInput}
          />
          <SelectInput aria-label="Filter by category" value={filters.category} onChange={(event) => updateFilters({ category: event.target.value, page: 1 })}>
            <option value="all">All categories</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </SelectInput>
          <SelectInput aria-label="Filter by section" value={filters.section} onChange={(event) => updateFilters({ section: event.target.value, page: 1 })}>
            <option value="all">All sections</option>
            {sectionOptions.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </SelectInput>
          <SelectInput aria-label="Filter by status" value={filters.status} onChange={(event) => updateFilters({ status: event.target.value, page: 1 })}>
            <option value="all">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
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
          <table className="adminDataTableTable min-w-[900px] w-full border-collapse">
            <thead>
              <tr>
                <th className="adminDataTableHeadCell text-left">
                  <SortableHeader label="Listing" column="title" activeSort={filters.sort} activeDir={filters.dir} onSort={handleSortChange} />
                </th>
                <th className="adminDataTableHeadCell text-left">
                  <SortableHeader label="Status" column="status" activeSort={filters.sort} activeDir={filters.dir} onSort={handleSortChange} />
                </th>
                <th className="adminDataTableHeadCell text-left">Section</th>
                <th className="adminDataTableHeadCell text-left">Primary Category</th>
                <th className="adminDataTableHeadCell text-left">More Categories</th>
                <th className="adminDataTableHeadCell text-left">
                  <SortableHeader label="Updated" column="updatedAt" activeSort={filters.sort} activeDir={filters.dir} onSort={handleSortChange} />
                </th>
              </tr>
            </thead>
            <tbody>
              {listings.length === 0 ? (
                <tr>
                  <td className="adminDataTableCell px-4 py-6 text-[color:var(--admin-muted)]" colSpan={6}>
                    {isPending ? "Updating listings..." : "No listings match the current filters."}
                  </td>
                </tr>
              ) : (
                listings.map((listing, index) => {
                  const additionalCategories = listing.categoryLabels.filter((label) => label !== listing.primaryCategoryLabel);

                  return (
                    <tr
                      key={listing.id}
                      className="adminDataTableRow"
                      data-last={index === listings.length - 1 ? "true" : undefined}
                      tabIndex={0}
                      onClick={() => router.push(`/admin/listings/${listing.id}/edit`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(`/admin/listings/${listing.id}/edit`);
                        }
                      }}
                    >
                      <td className="adminDataTableCell px-4 py-4">
                        <div className="adminListingPrimaryCell">
                          <strong>{listing.title}</strong>
                          <span className="muted">{listing.slug}</span>
                        </div>
                      </td>
                      <td className="adminDataTableCell px-4 py-4">
                        <div className="adminListingStatusCell">
                          <Badge tone={getStatusTone(listing.status)}>{getStatusLabel(listing.status)}</Badge>
                          {listing.hasDraftRevision ? <Badge className={ADMIN_DRAFT_CHIP_CLASS} tone="primary">Draft changes</Badge> : null}
                        </div>
                      </td>
                      <td className="adminDataTableCell px-4 py-4">{listing.sectionLabel}</td>
                      <td className="adminDataTableCell px-4 py-4">{listing.primaryCategoryLabel}</td>
                      <td className="adminDataTableCell px-4 py-4">
                        <span className={ADMIN_TABLE_CLAMP_CLASS}>{additionalCategories.length > 0 ? additionalCategories.join(", ") : "-"}</span>
                      </td>
                      <td className="adminDataTableCell px-4 py-4">{formatDate(listing.updatedAt)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className={ADMIN_TABLE_FOOTER_CLASS}>
          <p className="muted">
            Showing {total === 0 ? 0 : (page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total} listings
          </p>
          <AdminPagination page={page} total={totalPages} onChange={(nextPage) => updateFilters({ page: nextPage })} />
        </div>
      </section>
    </>
  );
}
