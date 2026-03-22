import Link from "next/link";
import type { Role } from "@prisma/client";
import {
  ADMIN_CARD_DESCRIPTION_CLASS,
  ADMIN_CARD_HEADER_CLASS,
  ADMIN_CARD_SURFACE_CLASS,
  ADMIN_CARD_TITLE_CLASS,
  ADMIN_CARD_WRAPPER_CLASS,
  ADMIN_HEADER_ROW_CLASS,
  ADMIN_HERO_CLASS,
  ADMIN_MENU_CARD_DESCRIPTION_CLASS,
  ADMIN_MENU_CARD_LINK_CLASS,
  ADMIN_MENU_GRID_CLASS,
  ADMIN_PAGE_CLASS,
  ADMIN_SCOPE_BADGE_CLASS,
  ADMIN_TITLE_CLASS
} from "@/components/admin/admin-tailwind";
import { requireServerAdminUser } from "@/lib/admin-auth-server";

type MenuItem = {
  title: string;
  description: string;
  href: string;
  roles: Role[];
};

function getScopeLabel(roles: Role[]) {
  if (roles.length === 1 && roles[0] === "ADMINISTRATOR") {
    return "Admin only";
  }

  if (roles.length === 1 && roles[0] === "OWNER") {
    return "Owner only";
  }

  return "Admin + Owner";
}

const menuItems: MenuItem[] = [
  {
    title: "Listings",
    description: "Create, edit, and publish listings.",
    href: "/admin/listings",
    roles: ["ADMINISTRATOR", "OWNER"]
  },
  {
    title: "Users",
    description: "Manage admin users and roles.",
    href: "/admin/users",
    roles: ["ADMINISTRATOR"]
  },
  {
    title: "Sections",
    description: "Manage editorial groupings and navigation buckets.",
    href: "/admin/sections",
    roles: ["ADMINISTRATOR"]
  },
  {
    title: "Search Suggestions",
    description: "Curate the global search suggestions.",
    href: "/admin/search-suggestions",
    roles: ["ADMINISTRATOR"]
  },
  {
    title: "Categories",
    description: "Manage canonical categories and assign sections and schemas.",
    href: "/admin/categories",
    roles: ["ADMINISTRATOR"]
  },
  {
    title: "Schemas",
    description: "Compose listing schemas from the available field registry.",
    href: "/admin/schemas",
    roles: ["ADMINISTRATOR"]
  },
  {
    title: "Fields",
    description: "Browse the code-defined listing fields available to schemas.",
    href: "/admin/fields",
    roles: ["ADMINISTRATOR"]
  },
  {
    title: "Sliders",
    description: "Rename, reorder, or remove sliders.",
    href: "/admin/sliders",
    roles: ["ADMINISTRATOR"]
  },
  {
    title: "UI Kit",
    description: "Preview reusable components and form states.",
    href: "/admin/ui-kit",
    roles: ["ADMINISTRATOR"]
  }
];

export default async function AdminDashboardPage() {
  const user = await requireServerAdminUser();
  const allowedItems = menuItems.filter((item) => item.roles.includes(user.role));

  return (
    <main className={ADMIN_PAGE_CLASS}>
      <section className={ADMIN_HERO_CLASS}>
        <div className={ADMIN_HEADER_ROW_CLASS}>
          <h1 className={ADMIN_TITLE_CLASS}>Admin</h1>
        </div>
        <p>Choose what you want to manage.</p>
      </section>

      <section className={ADMIN_MENU_GRID_CLASS}>
        {allowedItems.map((item) => (
          <Link key={item.href} href={item.href} className={ADMIN_MENU_CARD_LINK_CLASS}>
            <article className={`${ADMIN_CARD_WRAPPER_CLASS} min-h-full transition duration-150 hover:-translate-y-px hover:border-[rgba(15,118,110,0.22)] focus-visible:-translate-y-px focus-visible:border-[rgba(15,118,110,0.22)]`}>
              <div className={ADMIN_CARD_SURFACE_CLASS}>
                <div className={`${ADMIN_CARD_HEADER_CLASS} grid gap-2.5 px-5 pb-[18px] pt-5`}>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className={`${ADMIN_CARD_TITLE_CLASS} leading-[1.2]`}>{item.title}</div>
                    <span className={ADMIN_SCOPE_BADGE_CLASS}>{getScopeLabel(item.roles)}</span>
                  </div>
                  <p className={`${ADMIN_CARD_DESCRIPTION_CLASS} ${ADMIN_MENU_CARD_DESCRIPTION_CLASS}`}>{item.description}</p>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </section>
    </main>
  );
}
