import { Button } from "@/components/base/buttons/button";
import AdminListingsTable from "@/app/(admin)/components/AdminListingsTable";
import {
  ADMIN_HEADER_ACTIONS_CLASS,
  ADMIN_HEADER_ROW_CLASS,
  ADMIN_HERO_CLASS,
  ADMIN_PAGE_CLASS,
  ADMIN_TITLE_CLASS
} from "@/app/(admin)/components/admin-tailwind";
import { requireServerAdminUser } from "@/app/(admin)/lib/admin-auth-server";
import {
  getAdminListingsPageData,
  type AdminListingsSortDirection,
  type AdminListingsSortField
} from "@/app/(admin)/lib/admin-listings";

function normalizeSortField(value: string | string[] | undefined): AdminListingsSortField {
  return value === "title" || value === "status" || value === "ownerUsername" ? value : "updatedAt";
}

function normalizeSortDirection(value: string | string[] | undefined): AdminListingsSortDirection {
  return value === "ascending" || value === "descending" ? value : "descending";
}

type AdminListingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminListingsPage({ searchParams }: AdminListingsPageProps) {
  const user = await requireServerAdminUser();
  const params = await searchParams;

  const query = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "all";
  const section = typeof params.section === "string" ? params.section : "all";
  const category = typeof params.category === "string" ? params.category : "all";
  const owner = typeof params.owner === "string" ? params.owner : "all";
  const sort = normalizeSortField(params.sort);
  const dir = normalizeSortDirection(params.dir);
  const page = typeof params.page === "string" ? Number(params.page) || 1 : 1;
  const pageSize = typeof params.pageSize === "string" ? Number(params.pageSize) || 25 : 25;

  const listingsPage = await getAdminListingsPageData(user, {
    query,
    status,
    section,
    category,
    owner,
    sort,
    dir,
    page,
    pageSize
  });

  return (
    <main className={ADMIN_PAGE_CLASS}>
      <section className={ADMIN_HERO_CLASS}>
        <div className={ADMIN_HEADER_ROW_CLASS}>
          <h1 className={ADMIN_TITLE_CLASS}>Listings</h1>
          <div className={ADMIN_HEADER_ACTIONS_CLASS}>
            <Button size="md" href="/admin/listings/new">
              New Listing
            </Button>
          </div>
        </div>
      </section>

      <AdminListingsTable
        listings={listingsPage.listings}
        total={listingsPage.total}
        page={listingsPage.page}
        pageSize={listingsPage.pageSize}
        statusCounts={listingsPage.statusCounts}
        sectionOptions={listingsPage.sectionOptions}
        categoryOptions={listingsPage.categoryOptions}
        ownerOptions={listingsPage.ownerOptions}
        filters={{ query, status, section, category, owner, sort, dir }}
      />
    </main>
  );
}
