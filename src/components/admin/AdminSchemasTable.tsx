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
import type {
  AdminSchemaRow,
  AdminSchemasSortDirection,
  AdminSchemasSortField
} from "@/lib/admin-schemas";

type AdminSchemasTableProps = {
  schemas: AdminSchemaRow[];
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
    frontendFilters: string;
    sort: AdminSchemasSortField;
    dir: AdminSchemasSortDirection;
  };
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const SEARCH_DEBOUNCE_MS = 280;
const SORTABLE_COLUMNS: ReadonlySet<AdminSchemasSortField> = new Set([
  "updatedAt",
  "label",
  "status",
  "sortOrder",
  "fieldCount"
]);

function getStatusColor(isActive: boolean) {
  return isActive ? ("success" as const) : ("default" as const);
}

function getStatusLabel(isActive: boolean) {
  return isActive ? "Active" : "Inactive";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function AdminSchemasTable({
  schemas,
  total,
  page,
  pageSize,
  statusCounts,
  filters
}: AdminSchemasTableProps) {
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
    (next: Partial<AdminSchemasTableProps["filters"] & { page?: number; pageSize?: number }>) => {
      const params = new URLSearchParams(searchParams.toString());

      const nextPage = next.page ?? 1;
      const nextPageSize = next.pageSize ?? pageSize;
      const nextQuery = next.query ?? queryInput;
      const nextStatus = next.status ?? filters.status;
      const nextFrontendFilters = next.frontendFilters ?? filters.frontendFilters;
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

      if (nextFrontendFilters !== "all") {
        params.set("frontendFilters", nextFrontendFilters);
      } else {
        params.delete("frontendFilters");
      }

      if (nextSort !== "sortOrder") {
        params.set("sort", nextSort);
      } else {
        params.delete("sort");
      }

      if (nextDir !== "ascending") {
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
    [filters.dir, filters.frontendFilters, filters.sort, filters.status, pageSize, pathname, queryInput, router, searchParams]
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

    if (!SORTABLE_COLUMNS.has(nextColumn as AdminSchemasSortField)) {
      return;
    }

    updateFilters({
      sort: nextColumn as AdminSchemasSortField,
      dir: descriptor.direction === "descending" ? "descending" : "ascending",
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
            aria-label="Search schemas"
            classNames={{ inputWrapper: "!shadow-none" }}
            isClearable
            placeholder="Search label, slug, or description"
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
            aria-label="Filter schemas by status"
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
            aria-label="Filter schemas by frontend filter support"
            classNames={{ trigger: ADMIN_SELECT_TRIGGER_CLASS }}
            disallowEmptySelection
            radius="lg"
            selectedKeys={new Set([filters.frontendFilters])}
            size="lg"
            variant="bordered"
            onSelectionChange={(keys) => {
              const nextValue = keys instanceof Set ? String(keys.values().next().value ?? "all") : "all";
              updateFilters({ frontendFilters: nextValue, page: 1 });
            }}
          >
            <SelectItem key="all">All field setups</SelectItem>
            <SelectItem key="enabled">With frontend filters</SelectItem>
            <SelectItem key="disabled">Without frontend filters</SelectItem>
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
            aria-label="Schemas table"
            classNames={{
              base: "adminDataTable",
              table: "adminDataTableTable adminSchemasDataTableTable",
              th: "adminDataTableHeadCell",
              td: "adminDataTableCell",
              tr: "adminDataTableRow"
            }}
            removeWrapper
            shadow="none"
            sortDescriptor={sortDescriptor}
            onSortChange={handleSortChange}
            onRowAction={(key) => {
              const schema = schemas.find((item) => item.id === key);
              if (!schema) {
                return;
              }

              router.push(`/admin/schemas/${schema.id}/edit`);
            }}
          >
            <TableHeader>
              <TableColumn key="label" allowsSorting isRowHeader>
                Schema
              </TableColumn>
              <TableColumn key="status" allowsSorting>
                Status
              </TableColumn>
              <TableColumn key="fieldCount" allowsSorting>
                Fields
              </TableColumn>
              <TableColumn key="sortOrder" allowsSorting>
                Order
              </TableColumn>
              <TableColumn key="updatedAt" allowsSorting>
                Updated
              </TableColumn>
            </TableHeader>
            <TableBody emptyContent={isPending ? "Updating schemas..." : "No schemas match the current filters."} items={schemas}>
              {(schema) => (
                <TableRow key={schema.id} textValue={`${schema.label} ${schema.slug}`}>
                  <TableCell>
                    <div className="adminListingPrimaryCell">
                      <strong>{schema.label}</strong>
                      <span className="muted">{schema.slug}</span>
                      {schema.description?.trim() ? (
                        <span className={`muted ${ADMIN_TABLE_CLAMP_CLASS}`}>{schema.description}</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="adminListingStatusCell">
                      <Chip color={getStatusColor(schema.isActive)} radius="sm" size="sm" variant="flat">
                        {getStatusLabel(schema.isActive)}
                      </Chip>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={ADMIN_TABLE_CLAMP_CLASS}>
                      {schema.fieldCount} total{schema.frontendFilterCount > 0 ? ` · ${schema.frontendFilterCount} frontend` : ""}
                    </span>
                  </TableCell>
                  <TableCell>{schema.sortOrder}</TableCell>
                  <TableCell>{formatDate(schema.updatedAt)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className={ADMIN_TABLE_FOOTER_CLASS}>
          <p className="muted">
            Showing {total === 0 ? 0 : (page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total} schemas
          </p>
          <Pagination page={page} total={totalPages} onChange={(nextPage) => updateFilters({ page: nextPage })} />
        </div>
      </section>
    </>
  );
}
