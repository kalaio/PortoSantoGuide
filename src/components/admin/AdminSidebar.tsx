"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type FC, useMemo, useState } from "react";
import type { Role } from "@prisma/client";
import {
  BookOpen01,
  FilePlus03,
  Folder,
  LayersTwo02,
  MarkerPin01,
  PieChart01,
  PlayCircle,
  SearchLg,
  SearchMd,
  Settings01,
  Users01,
  ZapFast
} from "@untitledui/icons";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import { AvatarLabelGroup } from "@/components/base/avatar/avatar-label-group";
import { Input } from "@/components/base/input/input";
import { MobileNavigationHeader } from "@/components/application/app-navigation/base-components/mobile-header";
import { NavItemBase } from "@/components/application/app-navigation/base-components/nav-item";
import { cx } from "@/utils/cx";

type SidebarUser = {
  username: string;
  role: Role;
};

type NavItem = {
  label: string;
  href: string;
  icon: FC<{ className?: string }>;
  roles: Role[];
};

type NavGroup = {
  label: string;
  roles: Role[];
  items: NavItem[];
};

const DASHBOARD_ITEM: NavItem = {
  label: "Dashboard",
  href: "/admin",
  icon: PieChart01,
  roles: ["ADMINISTRATOR", "OWNER"]
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Directory",
    roles: ["ADMINISTRATOR", "OWNER"],
    items: [
      { label: "Listings", href: "/admin/listings", icon: MarkerPin01, roles: ["ADMINISTRATOR", "OWNER"] },
      { label: "Sections", href: "/admin/sections", icon: LayersTwo02, roles: ["ADMINISTRATOR"] },
      { label: "Categories", href: "/admin/categories", icon: Folder, roles: ["ADMINISTRATOR"] },
      { label: "Schemas", href: "/admin/schemas", icon: FilePlus03, roles: ["ADMINISTRATOR"] },
      { label: "Fields", href: "/admin/fields", icon: BookOpen01, roles: ["ADMINISTRATOR"] }
    ]
  },
  {
    label: "Discovery",
    roles: ["ADMINISTRATOR"],
    items: [{ label: "Search Suggestions", href: "/admin/search-suggestions", icon: SearchMd, roles: ["ADMINISTRATOR"] }]
  },
  {
    label: "Media",
    roles: ["ADMINISTRATOR"],
    items: [
      { label: "Sliders", href: "/admin/sliders", icon: ZapFast, roles: ["ADMINISTRATOR"] },
      { label: "Slides", href: "/admin/slides", icon: PlayCircle, roles: ["ADMINISTRATOR"] }
    ]
  },
  {
    label: "Administration",
    roles: ["ADMINISTRATOR"],
    items: [{ label: "Users", href: "/admin/users", icon: Users01, roles: ["ADMINISTRATOR"] }, { label: "UI Kit", href: "/admin/ui-kit", icon: Settings01, roles: ["ADMINISTRATOR"] }]
  }
];

function isActivePath(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function formatRole(role: Role) {
  switch (role) {
    case "ADMINISTRATOR":
      return "Administrator";
    case "OWNER":
      return "Owner";
    default:
      return "Subscriber";
  }
}

function SidebarBrand({ variant = "default" }: { variant?: "default" | "compact" | "drawer" }) {
  const logoClassName =
    variant === "compact"
      ? "block h-16 w-auto"
      : variant === "drawer"
        ? "block h-16 w-auto"
        : "block h-20 w-auto";

  return (
    <Link href="/admin" className="inline-flex items-center rounded-xl no-underline outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2">
      <Image
        src="/branding/porto-santo-guide.svg"
        alt="Porto Santo Guide"
        width={104}
        height={91}
        priority
        className={logoClassName}
      />
    </Link>
  );
}

function SidebarAccountCard({ user }: { user: SidebarUser }) {
  return (
    <div className="relative rounded-xl p-3 ring-1 ring-secondary ring-inset">
      <div className="absolute right-1.5 top-1.5">
        <AdminLogoutButton iconOnly />
      </div>

      <AvatarLabelGroup size="md" title={user.username} subtitle={formatRole(user.role)} status="online" />
    </div>
  );
}

export default function AdminSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const isDashboardVisible =
    DASHBOARD_ITEM.roles.includes(user.role) &&
    (normalizedQuery.length === 0 || DASHBOARD_ITEM.label.toLowerCase().includes(normalizedQuery));

  const filteredGroups = useMemo(
    () =>
      NAV_GROUPS.filter((group) => group.roles.includes(user.role))
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => {
            if (!item.roles.includes(user.role)) {
              return false;
            }

            return (
              normalizedQuery.length === 0 ||
              group.label.toLowerCase().includes(normalizedQuery) ||
              item.label.toLowerCase().includes(normalizedQuery)
            );
          })
        }))
        .filter((group) => group.items.length > 0),
    [normalizedQuery, user.role]
  );

  function renderContent({ mobile = false }: { mobile?: boolean } = {}) {
    return (
      <aside className="flex h-full min-h-screen w-full max-w-full flex-col border-secondary bg-primary pt-0 shadow-xs md:border-r lg:h-screen lg:min-h-0 lg:bg-[var(--admin-surface)] lg:backdrop-blur-[18px]">
        <div className="flex flex-col gap-4 px-4 lg:px-5">
          <SidebarBrand variant={mobile ? "drawer" : "default"} />
          <Input
            aria-label="Search admin navigation"
            icon={SearchLg}
            placeholder="Search"
            size="md"
            value={query}
            onChange={setQuery}
          />
        </div>

        <div className="adminSidebarScrollArea mt-4 min-h-0 flex-1 overflow-y-auto">
          <nav aria-label="Admin navigation" className="pb-6">
            {isDashboardVisible ? (
              <ul className="px-2 lg:px-4">
                <li className="py-0.5">
                  <NavItemBase
                    type="link"
                    href={DASHBOARD_ITEM.href}
                    icon={DASHBOARD_ITEM.icon}
                    current={isActivePath(pathname, DASHBOARD_ITEM.href)}
                  >
                    {DASHBOARD_ITEM.label}
                  </NavItemBase>
                </li>
              </ul>
            ) : null}

            <ul className={cx("flex flex-col", isDashboardVisible ? "mt-4" : "mt-1")}>
              {filteredGroups.map((group) => (
                <li key={group.label}>
                  <div className="px-5 pb-1">
                    <p className="text-sm font-semibold text-tertiary">{group.label}</p>
                  </div>
                  <ul className="px-2 pb-5 lg:px-4">
                    {group.items.map((item) => (
                      <li key={item.href} className="py-0.5">
                        <NavItemBase type="link" href={item.href} icon={item.icon} current={isActivePath(pathname, item.href)}>
                          {item.label}
                        </NavItemBase>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>

            {!isDashboardVisible && filteredGroups.length === 0 ? (
              <p className="px-5 pt-2 text-sm text-tertiary">No navigation items match your search.</p>
            ) : null}
          </nav>
        </div>

        <div className="mt-auto shrink-0 px-2 pb-4 pt-2 lg:px-4 lg:pb-6">
          <SidebarAccountCard user={user} />
        </div>
      </aside>
    );
  }

  return (
    <>
      <MobileNavigationHeader brand={<SidebarBrand variant="compact" />}>{renderContent({ mobile: true })}</MobileNavigationHeader>
      <div className="hidden lg:sticky lg:top-0 lg:block lg:h-screen">{renderContent()}</div>
    </>
  );
}
