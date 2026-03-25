import { Button } from "@/components/base/buttons/button";
import AdminSectionsTable from "@/app/(admin)/components/AdminSectionsTable";
import {
  ADMIN_HEADER_ACTIONS_CLASS,
  ADMIN_HEADER_ROW_CLASS,
  ADMIN_HERO_CLASS,
  ADMIN_PAGE_CLASS,
  ADMIN_TITLE_CLASS
} from "@/app/(admin)/components/admin-tailwind";
import { requireServerUserWithRole } from "@/lib/admin-auth-server";
import {
  getAdminSectionsPageData,
  type AdminSectionsSortDirection,
  type AdminSectionsSortField
} from "@/lib/admin-sections";

function normalizeSortField(value: string | string[] | undefined): AdminSectionsSortField {
  return value === "updatedAt" || value === "label" || value === "status" ? value : "sortOrder";
}

function normalizeSortDirection(value: string | string[] | undefined): AdminSectionsSortDirection {
  return value === "ascending" || value === "descending" ? value : "ascending";
}

type AdminSectionsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminSectionsPage({ searchParams }: AdminSectionsPageProps) {
  const user = await requireServerUserWithRole(["ADMINISTRATOR"]);
  const params = await searchParams;

  const query = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "all";
  const sort = normalizeSortField(params.sort);
  const dir = normalizeSortDirection(params.dir);
  const page = typeof params.page === "string" ? Number(params.page) || 1 : 1;
  const pageSize = typeof params.pageSize === "string" ? Number(params.pageSize) || 25 : 25;

  const sectionsPage = await getAdminSectionsPageData(user, {
    query,
    status,
    sort,
    dir,
    page,
    pageSize
  });

  return (
    <main className={ADMIN_PAGE_CLASS}>
      <section className={ADMIN_HERO_CLASS}>
        <div className={ADMIN_HEADER_ROW_CLASS}>
          <h1 className={ADMIN_TITLE_CLASS}>Sections</h1>
          <div className={ADMIN_HEADER_ACTIONS_CLASS}>
            <Button size="md" href="/admin/sections/new">
              New Section
            </Button>
          </div>
        </div>
      </section>

      <AdminSectionsTable
        sections={sectionsPage.sections}
        total={sectionsPage.total}
        page={sectionsPage.page}
        pageSize={sectionsPage.pageSize}
        statusCounts={sectionsPage.statusCounts}
        filters={{ query, status, sort, dir }}
      />
    </main>
  );
}
