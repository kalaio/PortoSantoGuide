import { redirect } from "next/navigation";
import { Button } from "@/components/base/buttons/button";
import AdminCategoriesTable from "@/app/(admin)/components/AdminCategoriesTable";
import {
  ADMIN_HEADER_ACTIONS_CLASS,
  ADMIN_HEADER_ROW_CLASS,
  ADMIN_HERO_CLASS,
  ADMIN_PAGE_CLASS,
  ADMIN_TITLE_CLASS
} from "@/app/(admin)/components/admin-tailwind";
import { requireServerAdminUser } from "@/app/(admin)/lib/admin-auth-server";
import {
  getAdminCategoriesPageData,
  type AdminCategoriesSortDirection,
  type AdminCategoriesSortField
} from "@/app/(admin)/lib/admin-categories";

function normalizeSortField(value: string | string[] | undefined): AdminCategoriesSortField {
  return value === "updatedAt" || value === "label" || value === "status" ? value : "sortOrder";
}

function normalizeSortDirection(value: string | string[] | undefined): AdminCategoriesSortDirection {
  return value === "ascending" || value === "descending" ? value : "ascending";
}

type AdminCategoriesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminCategoriesPage({ searchParams }: AdminCategoriesPageProps) {
  const user = await requireServerAdminUser();
  const params = await searchParams;

  if (user.role !== "ADMINISTRATOR") {
    redirect("/admin/forbidden");
  }

  const query = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "all";
  const section = typeof params.section === "string" ? params.section : "all";
  const schema = typeof params.schema === "string" ? params.schema : "all";
  const sort = normalizeSortField(params.sort);
  const dir = normalizeSortDirection(params.dir);
  const page = typeof params.page === "string" ? Number(params.page) || 1 : 1;
  const pageSize = typeof params.pageSize === "string" ? Number(params.pageSize) || 25 : 25;

  const categoriesPage = await getAdminCategoriesPageData(user, {
    query,
    status,
    section,
    schema,
    sort,
    dir,
    page,
    pageSize
  });

  return (
    <main className={ADMIN_PAGE_CLASS}>
      <section className={ADMIN_HERO_CLASS}>
        <div className={ADMIN_HEADER_ROW_CLASS}>
          <h1 className={ADMIN_TITLE_CLASS}>Categories</h1>
          <div className={ADMIN_HEADER_ACTIONS_CLASS}>
            <Button size="md" href="/admin/categories/new">
              New Category
            </Button>
          </div>
        </div>
      </section>

      <AdminCategoriesTable
        categories={categoriesPage.categories}
        total={categoriesPage.total}
        page={categoriesPage.page}
        pageSize={categoriesPage.pageSize}
        statusCounts={categoriesPage.statusCounts}
        sectionOptions={categoriesPage.sectionOptions}
        schemaOptions={categoriesPage.schemaOptions}
        hasUnassignedSchema={categoriesPage.hasUnassignedSchema}
        filters={{ query, status, section, schema, sort, dir }}
      />
    </main>
  );
}
