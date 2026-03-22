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
  ADMIN_TABLE_FILTERS_CLASS,
  ADMIN_TABLE_FOOTER_CLASS,
  ADMIN_TABLE_PANEL_CLASS,
  ADMIN_TABLE_SEARCH_ICON_CLASS,
  ADMIN_TABLE_SCROLLER_CLASS,
  ADMIN_TOOLBAR_PANEL_CLASS
} from "@/components/admin/admin-tailwind";
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
  const sortDescriptor: SortDescriptor = {
    column: filters.sort,
    direction: filters.dir
  };

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

      if (nextSchema !== "all") {
        params.set("schema", nextSchema);
      } else {
        params.delete("schema");
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
    [filters.dir, filters.schema, filters.section, filters.sort, filters.status, pageSize, pathname, queryInput, router, searchParams]
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

    if (!SORTABLE_COLUMNS.has(nextColumn as AdminCategoriesSortField)) {
      return;
    }

    updateFilters({
      sort: nextColumn as AdminCategoriesSortField,
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

        <div className={ADMIN_TABLE_FILTERS_CLASS}>
          <Input
            aria-label="Search categories"
            classNames={{ inputWrapper: "!shadow-none" }}
            isClearable
            placeholder="Search label, slug, section, schema, or icon"
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
            aria-label="Filter categories by status"
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
            aria-label="Filter categories by section"
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
                <SelectItem key={section.value}>{section.label}</SelectItem>
              ))}
            </>
          </Select>
          <Select
            aria-label="Filter categories by schema"
            classNames={{ trigger: ADMIN_SELECT_TRIGGER_CLASS }}
            disallowEmptySelection
            radius="lg"
            selectedKeys={new Set([filters.schema])}
            size="lg"
            variant="bordered"
            onSelectionChange={(keys) => {
              const nextValue = keys instanceof Set ? String(keys.values().next().value ?? "all") : "all";
              updateFilters({ schema: nextValue, page: 1 });
            }}
          >
            <>
              <SelectItem key="all">All schemas</SelectItem>
              {hasUnassignedSchema ? <SelectItem key="none">No schema</SelectItem> : null}
              {schemaOptions.map((schema) => (
                <SelectItem key={schema.value}>{schema.label}</SelectItem>
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
            aria-label="Categories table"
            classNames={{
              base: "adminDataTable",
              table: "adminDataTableTable adminCategoriesDataTableTable",
              th: "adminDataTableHeadCell",
              td: "adminDataTableCell",
              tr: "adminDataTableRow"
            }}
            removeWrapper
            shadow="none"
            sortDescriptor={sortDescriptor}
            onSortChange={handleSortChange}
            onRowAction={(key) => {
              const category = categories.find((item) => item.id === key);
              if (!category) {
                return;
              }

              router.push(`/admin/categories/${category.id}/edit`);
            }}
          >
            <TableHeader>
              <TableColumn key="label" allowsSorting isRowHeader>
                Category
              </TableColumn>
              <TableColumn key="status" allowsSorting>
                Status
              </TableColumn>
              <TableColumn key="section">Section</TableColumn>
              <TableColumn key="schema">Schema</TableColumn>
              <TableColumn key="icon">Icon</TableColumn>
              <TableColumn key="sortOrder" allowsSorting>
                Order
              </TableColumn>
              <TableColumn key="updatedAt" allowsSorting>
                Updated
              </TableColumn>
            </TableHeader>
            <TableBody emptyContent={isPending ? "Updating categories..." : "No categories match the current filters."} items={categories}>
              {(category) => (
                <TableRow key={category.id} textValue={`${category.label} ${category.slug}`}>
                  <TableCell>
                    <div className="adminListingPrimaryCell">
                      <strong>{category.label}</strong>
                      <span className="muted">{category.slug}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="adminListingStatusCell">
                      <Chip color={getStatusColor(category.isActive)} radius="sm" size="sm" variant="flat">
                        {getStatusLabel(category.isActive)}
                      </Chip>
                    </div>
                  </TableCell>
                  <TableCell>{category.section.label}</TableCell>
                  <TableCell>{category.schema?.label ?? "No schema"}</TableCell>
                  <TableCell>
                    <span className={ADMIN_TABLE_CLAMP_CLASS}>{category.iconName ?? "-"}</span>
                  </TableCell>
                  <TableCell>{category.sortOrder}</TableCell>
                  <TableCell>{formatDate(category.updatedAt)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className={ADMIN_TABLE_FOOTER_CLASS}>
          <p className="muted">
            Showing {total === 0 ? 0 : (page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total} categories
          </p>
          <Pagination page={page} total={totalPages} onChange={(nextPage) => updateFilters({ page: nextPage })} />
        </div>
      </section>
    </>
  );
}
