import { Button } from "@/components/base/buttons/button";
import AdminSearchSuggestionsTable from "@/components/admin/AdminSearchSuggestionsTable";
import {
  ADMIN_HEADER_ACTIONS_CLASS,
  ADMIN_HEADER_ROW_CLASS,
  ADMIN_HERO_CLASS,
  ADMIN_PAGE_CLASS,
  ADMIN_TITLE_CLASS
} from "@/components/admin/admin-tailwind";
import { requireServerUserWithRole } from "@/lib/admin-auth-server";
import {
  getAdminSearchSuggestionsPageData,
  type AdminSearchSuggestionsSortDirection,
  type AdminSearchSuggestionsSortField
} from "@/lib/admin-search-suggestions";

function normalizeSortField(value: string | string[] | undefined): AdminSearchSuggestionsSortField {
  return value === "updatedAt" || value === "label" || value === "status" ? value : "priority";
}

function normalizeSortDirection(value: string | string[] | undefined): AdminSearchSuggestionsSortDirection {
  return value === "ascending" || value === "descending" ? value : "descending";
}

type AdminSearchSuggestionsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminSearchSuggestionsPage({ searchParams }: AdminSearchSuggestionsPageProps) {
  const user = await requireServerUserWithRole(["ADMINISTRATOR"]);
  const params = await searchParams;

  const query = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "all";
  const sort = normalizeSortField(params.sort);
  const dir = normalizeSortDirection(params.dir);
  const page = typeof params.page === "string" ? Number(params.page) || 1 : 1;
  const pageSize = typeof params.pageSize === "string" ? Number(params.pageSize) || 25 : 25;

  const suggestionsPage = await getAdminSearchSuggestionsPageData(user, {
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
          <h1 className={ADMIN_TITLE_CLASS}>Search Suggestions</h1>
          <div className={ADMIN_HEADER_ACTIONS_CLASS}>
            <Button size="md" href="/admin/search-suggestions/new">
              New Search Suggestion
            </Button>
          </div>
        </div>
      </section>

      <AdminSearchSuggestionsTable
        suggestions={suggestionsPage.suggestions}
        total={suggestionsPage.total}
        page={suggestionsPage.page}
        pageSize={suggestionsPage.pageSize}
        statusCounts={suggestionsPage.statusCounts}
        filters={{ query, status, sort, dir }}
      />
    </main>
  );
}
