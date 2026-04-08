"use client";

import { SearchMd } from "@untitledui/icons";
import { type Key, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AdminPagination from "@/app/(admin)/components/AdminPagination";
import { Table } from "@/components/application/table/table";
import {
  ADMIN_HEADER_ROW_DENSE_CLASS,
  ADMIN_DRAFT_CHIP_CLASS,
  ADMIN_METRICS_CLASS,
  ADMIN_SECTION_HEADING_CLASS,
  ADMIN_TABLE_CLAMP_CLASS,
  ADMIN_TABLE_FILTERS_CLASS,
  ADMIN_TABLE_FOOTER_CLASS,
  ADMIN_TABLE_PANEL_CLASS,
  ADMIN_TOOLBAR_PANEL_CLASS
} from "@/app/(admin)/components/admin-tailwind";
import { Badge, SelectInput, TextInput } from "@/components/ui";
import type { AdminListingRow, AdminListingsSortDirection, AdminListingsSortField } from "../lib/admin-listings";

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
  ownerOptions: string[];
  filters: {
    query: string;
    status: string;
    section: string;
    category: string;
    owner: string;
    sort: AdminListingsSortField;
    dir: AdminListingsSortDirection;
  };
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const SEARCH_DEBOUNCE_MS = 280;
const TABLE_COLUMNS = [
  { id: "title", label: "Listing", sortable: true },
  { id: "status", label: "Status", sortable: true },
  { id: "section", label: "Section", sortable: false },
  { id: "primaryCategory", label: "Primary Category", sortable: false },
  { id: "moreCategories", label: "More Categories", sortable: false },
  { id: "ownerUsername", label: "Utilizador", sortable: true },
  { id: "updatedAt", label: "Updated", sortable: true },
] as const satisfies ReadonlyArray<{ id: string; label: string; sortable: boolean }>;

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

export default function AdminListingsTable({
  listings,
  total,
  page,
  pageSize,
  statusCounts,
  sectionOptions,
  categoryOptions,
  ownerOptions,
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
      const nextOwner = next.owner ?? filters.owner;
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
      if (nextOwner !== "all") params.set("owner", nextOwner);
      else params.delete("owner");
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
    [filters.category, filters.dir, filters.owner, filters.section, filters.sort, filters.status, pageSize, pathname, queryInput, router, searchParams]
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

  function handleSortChange(sortDescriptor: { column: Key; direction: "ascending" | "descending" }) {
    const column = sortDescriptor.column as AdminListingsSortField;
    const nextDirection = filters.sort !== column && column === "updatedAt" ? "descending" : sortDescriptor.direction;

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
            <Badge tone="success">Published {statusCounts.published}</Badge>
            <Badge>Draft {statusCounts.draft}</Badge>
            <Badge tone="warning">Archived {statusCounts.archived}</Badge>
          </div>
        </div>

        <div className={ADMIN_TABLE_FILTERS_CLASS}>
          <TextInput
            aria-label="Search listings"
            id="admin-listings-search"
            icon={SearchMd}
            placeholder="Search title, slug, section, or category"
            value={queryInput}
            onChange={setQueryInput}
          />
          <SelectInput
            aria-label="Filter by category"
            id="admin-listings-category-filter"
            value={filters.category}
            onChange={(event) => updateFilters({ category: event.target.value, page: 1 })}
          >
            <option value="all">All categories</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </SelectInput>
          <SelectInput
            aria-label="Filter by section"
            id="admin-listings-section-filter"
            value={filters.section}
            onChange={(event) => updateFilters({ section: event.target.value, page: 1 })}
          >
            <option value="all">All sections</option>
            {sectionOptions.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </SelectInput>
          <SelectInput
            aria-label="Filter by status"
            id="admin-listings-status-filter"
            value={filters.status}
            onChange={(event) => updateFilters({ status: event.target.value, page: 1 })}
          >
            <option value="all">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </SelectInput>
          <SelectInput
            aria-label="Filter by owner"
            id="admin-listings-owner-filter"
            value={filters.owner}
            onChange={(event) => updateFilters({ owner: event.target.value, page: 1 })}
          >
            <option value="all">All users</option>
            {ownerOptions.map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </SelectInput>
          <SelectInput
            aria-label="Rows per page"
            id="admin-listings-page-size"
            value={String(pageSize)}
            onChange={(event) => updateFilters({ pageSize: Number(event.target.value), page: 1 })}
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>{`Show ${option}`}</option>
            ))}
          </SelectInput>
        </div>
      </section>

      <section className={ADMIN_TABLE_PANEL_CLASS}>
        <Table
          aria-label="Listings"
          className="min-w-[1120px]"
          sortDescriptor={{ column: filters.sort, direction: filters.dir }}
          onSortChange={handleSortChange}
          onRowAction={(key) => router.push(`/admin/listings/${String(key)}/edit`)}
        >
          <Table.Header columns={TABLE_COLUMNS}>
            {(column) => (
              <Table.Head id={column.id} label={column.label} allowsSorting={column.sortable} isRowHeader={column.id === "title"} />
            )}
          </Table.Header>
          <Table.Body
            items={listings}
            renderEmptyState={() => (
              <div className="px-6 py-6 text-sm text-tertiary">
                {isPending ? "Updating listings..." : "No listings match the current filters."}
              </div>
            )}
          >
            {(listing) => {
              const additionalCategories = listing.categoryLabels.filter((label) => label !== listing.primaryCategoryLabel);

              return (
                <Table.Row id={listing.id} onRowClick={() => router.push(`/admin/listings/${listing.id}/edit`)}>
                  <Table.Cell>
                    <div className="adminListingPrimaryCell">
                      <strong className="text-primary">{listing.title}</strong>
                      <span className="muted">{listing.slug}</span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="adminListingStatusCell">
                      <Badge tone={getStatusTone(listing.status)}>{getStatusLabel(listing.status)}</Badge>
                      {listing.hasDraftRevision ? <Badge className={ADMIN_DRAFT_CHIP_CLASS} tone="primary">Draft changes</Badge> : null}
                    </div>
                  </Table.Cell>
                  <Table.Cell>{listing.sectionLabel}</Table.Cell>
                  <Table.Cell>{listing.primaryCategoryLabel}</Table.Cell>
                  <Table.Cell>
                    <span className={ADMIN_TABLE_CLAMP_CLASS}>{additionalCategories.length > 0 ? additionalCategories.join(", ") : "-"}</span>
                  </Table.Cell>
                  <Table.Cell>{listing.ownerUsername}</Table.Cell>
                  <Table.Cell>{listing.updatedAtLabel}</Table.Cell>
                </Table.Row>
              );
            }}
          </Table.Body>
        </Table>

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
