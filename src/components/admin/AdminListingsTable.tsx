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
  ADMIN_DRAFT_CHIP_CLASS,
  ADMIN_METRICS_CLASS,
  ADMIN_SECTION_HEADING_CLASS,
  ADMIN_SELECT_TRIGGER_CLASS,
  ADMIN_TABLE_CLAMP_CLASS,
  ADMIN_TABLE_FILTERS_CLASS,
  ADMIN_TABLE_FOOTER_CLASS,
  ADMIN_TABLE_PANEL_CLASS,
  ADMIN_TABLE_SEARCH_ICON_CLASS,
  ADMIN_TABLE_SCROLLER_CLASS,
  ADMIN_TOOLBAR_PANEL_CLASS
} from "@/components/admin/admin-tailwind";
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

function getStatusColor(status: AdminListingRow["status"]) {
  switch (status) {
    case "PUBLISHED":
      return "success" as const;
    case "ARCHIVED":
      return "warning" as const;
    default:
      return "default" as const;
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
  const sortDescriptor: SortDescriptor = {
    column: filters.sort,
    direction: filters.dir
  };

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

      if (nextQuery) {
        params.set("q", nextQuery);
      } else {
        params.delete("q");
      }

      if (nextStatus !== "all") {
        params.set("status", nextStatus);
      } else {
        params.delete("status");
      }

      if (nextSection !== "all") {
        params.set("section", nextSection);
      } else {
        params.delete("section");
      }

      if (nextCategory !== "all") {
        params.set("category", nextCategory);
      } else {
        params.delete("category");
      }

      if (nextSort !== "updatedAt") {
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
    [filters.category, filters.dir, filters.section, filters.sort, filters.status, pageSize, pathname, queryInput, router, searchParams]
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

    if (!SORTABLE_COLUMNS.has(nextColumn as AdminListingsSortField)) {
      return;
    }

    updateFilters({
      sort: nextColumn as AdminListingsSortField,
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
            <Chip color="success" radius="sm" size="sm" variant="flat">Published {statusCounts.published}</Chip>
            <Chip radius="sm" size="sm" variant="flat">Draft {statusCounts.draft}</Chip>
            <Chip color="warning" radius="sm" size="sm" variant="flat">Archived {statusCounts.archived}</Chip>
          </div>
        </div>

        <div className={ADMIN_TABLE_FILTERS_CLASS}>
          <Input
            aria-label="Search listings"
            classNames={{ inputWrapper: "!shadow-none" }}
            isClearable
            placeholder="Search title, slug, section, or category"
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
            aria-label="Filter by status"
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
            <SelectItem key="DRAFT">Draft</SelectItem>
            <SelectItem key="PUBLISHED">Published</SelectItem>
            <SelectItem key="ARCHIVED">Archived</SelectItem>
          </Select>
          <Select
            aria-label="Filter by section"
            classNames={{ trigger: ADMIN_SELECT_TRIGGER_CLASS }}
            disallowEmptySelection
            radius="lg"
            selectedKeys={new Set([filters.section])}
            size="lg"
            variant="bordered"
            onSelectionChange={(keys) => {
              const nextValue = keys instanceof Set ? String(keys.values().next().value ?? "all") : "all";
              updateFilters({ section: nextValue, page: 1 });
            }}
          >
            <>
              <SelectItem key="all">All sections</SelectItem>
              {sectionOptions.map((section) => (
                <SelectItem key={section}>{section}</SelectItem>
              ))}
            </>
          </Select>
          <Select
            aria-label="Filter by category"
            classNames={{ trigger: ADMIN_SELECT_TRIGGER_CLASS }}
            disallowEmptySelection
            radius="lg"
            selectedKeys={new Set([filters.category])}
            size="lg"
            variant="bordered"
            onSelectionChange={(keys) => {
              const nextValue = keys instanceof Set ? String(keys.values().next().value ?? "all") : "all";
              updateFilters({ category: nextValue, page: 1 });
            }}
          >
            <>
              <SelectItem key="all">All categories</SelectItem>
              {categoryOptions.map((category) => (
                <SelectItem key={category}>{category}</SelectItem>
              ))}
            </>
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
            aria-label="Listings table"
            classNames={{
              base: "adminDataTable",
              table: "adminDataTableTable",
              th: "adminDataTableHeadCell",
              td: "adminDataTableCell",
              tr: "adminDataTableRow"
            }}
            removeWrapper
            shadow="none"
            sortDescriptor={sortDescriptor}
            onSortChange={handleSortChange}
            onRowAction={(key) => {
              const listing = listings.find((item) => item.id === key);
              if (!listing) {
                return;
              }

              router.push(`/admin/listings/${listing.id}/edit`);
            }}
          >
            <TableHeader>
              <TableColumn key="title" allowsSorting isRowHeader>
                Listing
              </TableColumn>
              <TableColumn key="status" allowsSorting>
                Status
              </TableColumn>
              <TableColumn key="section">
                Section
              </TableColumn>
              <TableColumn key="primaryCategory">
                Primary Category
              </TableColumn>
              <TableColumn key="categories">More Categories</TableColumn>
              <TableColumn key="updatedAt" allowsSorting>
                Updated
              </TableColumn>
            </TableHeader>
            <TableBody emptyContent={isPending ? "Updating listings..." : "No listings match the current filters."} items={listings}>
              {(listing) => {
                const additionalCategories = listing.categoryLabels.filter(
                  (label) => label !== listing.primaryCategoryLabel
                );

                return (
                  <TableRow key={listing.id} textValue={`${listing.title} ${listing.slug}`}>
                    <TableCell>
                      <div className="adminListingPrimaryCell">
                        <strong>{listing.title}</strong>
                        <span className="muted">{listing.slug}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="adminListingStatusCell">
                        <Chip color={getStatusColor(listing.status)} radius="sm" size="sm" variant="flat">
                          {getStatusLabel(listing.status)}
                        </Chip>
                        {listing.hasDraftRevision ? (
                          <Chip className={ADMIN_DRAFT_CHIP_CLASS} radius="sm" size="sm" variant="flat">
                            Draft changes
                          </Chip>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{listing.sectionLabel}</TableCell>
                    <TableCell>{listing.primaryCategoryLabel}</TableCell>
                    <TableCell>
                      <span className={ADMIN_TABLE_CLAMP_CLASS}>
                        {additionalCategories.length > 0 ? additionalCategories.join(", ") : "-"}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(listing.updatedAt)}</TableCell>
                  </TableRow>
                );
              }}
            </TableBody>
          </Table>
        </div>
        
        <div className={ADMIN_TABLE_FOOTER_CLASS}>
          <p className="muted">
            Showing {total === 0 ? 0 : (page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total} listings
          </p>
          <Pagination page={page} total={totalPages} onChange={(nextPage) => updateFilters({ page: nextPage })} />
        </div>
      </section>
    </>
  );
}
