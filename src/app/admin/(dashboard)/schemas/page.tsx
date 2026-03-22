import Link from "next/link";
import AdminSchemasTable from "@/components/admin/AdminSchemasTable";
import {
  ADMIN_HEADER_ACTIONS_CLASS,
  ADMIN_HEADER_ROW_CLASS,
  ADMIN_HERO_CLASS,
  ADMIN_PAGE_CLASS,
  ADMIN_TITLE_CLASS
} from "@/components/admin/admin-tailwind";
import { buttonClassName } from "@/components/ui/button-styles";
import { requireServerUserWithRole } from "@/lib/admin-auth-server";
import {
  getAdminSchemasPageData,
  type AdminSchemasSortDirection,
  type AdminSchemasSortField
} from "@/lib/admin-schemas";

function normalizeSortField(value: string | string[] | undefined): AdminSchemasSortField {
  return value === "updatedAt" || value === "label" || value === "status" || value === "fieldCount"
    ? value
    : "sortOrder";
}

function normalizeSortDirection(value: string | string[] | undefined): AdminSchemasSortDirection {
  return value === "ascending" || value === "descending" ? value : "ascending";
}

type AdminSchemasPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminSchemasPage({ searchParams }: AdminSchemasPageProps) {
  const user = await requireServerUserWithRole(["ADMINISTRATOR"]);
  const params = await searchParams;

  const query = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "all";
  const frontendFilters = typeof params.frontendFilters === "string" ? params.frontendFilters : "all";
  const sort = normalizeSortField(params.sort);
  const dir = normalizeSortDirection(params.dir);
  const page = typeof params.page === "string" ? Number(params.page) || 1 : 1;
  const pageSize = typeof params.pageSize === "string" ? Number(params.pageSize) || 25 : 25;

  const schemasPage = await getAdminSchemasPageData(user, {
    query,
    status,
    frontendFilters,
    sort,
    dir,
    page,
    pageSize
  });

  return (
    <main className={ADMIN_PAGE_CLASS}>
      <section className={ADMIN_HERO_CLASS}>
        <div className={ADMIN_HEADER_ROW_CLASS}>
          <h1 className={ADMIN_TITLE_CLASS}>Schemas</h1>
          <div className={ADMIN_HEADER_ACTIONS_CLASS}>
            <Link className={buttonClassName({})} href="/admin/schemas/new">
              New Schema
            </Link>
          </div>
        </div>
      </section>

      <AdminSchemasTable
        schemas={schemasPage.schemas}
        total={schemasPage.total}
        page={schemasPage.page}
        pageSize={schemasPage.pageSize}
        statusCounts={schemasPage.statusCounts}
        filters={{ query, status, frontendFilters, sort, dir }}
      />
    </main>
  );
}
