import Link from "next/link";
import AdminUsersTable from "@/components/admin/AdminUsersTable";
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
  getAdminUsersPageData,
  type AdminUsersSortDirection,
  type AdminUsersSortField
} from "@/lib/admin-users";

function normalizeSortField(value: string | string[] | undefined): AdminUsersSortField {
  return value === "username" || value === "role" || value === "status" ? value : "createdAt";
}

function normalizeSortDirection(value: string | string[] | undefined): AdminUsersSortDirection {
  return value === "ascending" || value === "descending" ? value : "descending";
}

type AdminUsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const user = await requireServerUserWithRole(["ADMINISTRATOR"]);
  const params = await searchParams;

  const query = typeof params.q === "string" ? params.q : "";
  const role = typeof params.role === "string" ? params.role : "all";
  const status = typeof params.status === "string" ? params.status : "all";
  const sort = normalizeSortField(params.sort);
  const dir = normalizeSortDirection(params.dir);
  const page = typeof params.page === "string" ? Number(params.page) || 1 : 1;
  const pageSize = typeof params.pageSize === "string" ? Number(params.pageSize) || 25 : 25;

  const usersPage = await getAdminUsersPageData(user, {
    query,
    role,
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
          <h1 className={ADMIN_TITLE_CLASS}>Users</h1>
          <div className={ADMIN_HEADER_ACTIONS_CLASS}>
            <Link className={buttonClassName({})} href="/admin/users/new">
              New User
            </Link>
          </div>
        </div>
      </section>

      <AdminUsersTable
        users={usersPage.users}
        total={usersPage.total}
        page={usersPage.page}
        pageSize={usersPage.pageSize}
        statusCounts={usersPage.statusCounts}
        filters={{ query, role, status, sort, dir }}
      />
    </main>
  );
}
