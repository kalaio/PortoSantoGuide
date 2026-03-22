"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useMemo, useState } from "react";
import type { Role } from "@prisma/client";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import {
  ADMIN_BRAND_LINK_CLASS,
  ADMIN_SIDEBAR_ACCORDION_CLASS,
  ADMIN_SIDEBAR_ACCORDION_CONTENT_CLASS,
  ADMIN_SIDEBAR_ACCORDION_TITLE_CLASS,
  ADMIN_SIDEBAR_ACCORDION_TRIGGER_CLASS,
  ADMIN_SIDEBAR_BRAND_CLASS,
  ADMIN_SIDEBAR_CLASS,
  ADMIN_SIDEBAR_EMPTY_CLASS,
  ADMIN_SIDEBAR_FOOTER_CLASS,
  ADMIN_SIDEBAR_GROUP_NAV_CLASS,
  ADMIN_SIDEBAR_ICON_CLASS,
  ADMIN_SIDEBAR_IDENTITY_CLASS,
  ADMIN_SIDEBAR_INDICATOR_CLASS,
  ADMIN_SIDEBAR_ITEM_ACTIVE_CLASS,
  ADMIN_SIDEBAR_ITEM_BASE_CLASS,
  ADMIN_SIDEBAR_NAV_CLASS,
  ADMIN_SIDEBAR_NAV_SCROLL_CLASS,
  ADMIN_SIDEBAR_ROLE_CLASS,
  ADMIN_SIDEBAR_SEARCH_CLASS,
  ADMIN_SIDEBAR_SEARCH_FIELD_CLASS,
  ADMIN_SIDEBAR_SEARCH_ICON_CLASS,
  ADMIN_SIDEBAR_SEARCH_INPUT_CLASS,
  ADMIN_SIDEBAR_SUBITEM_CLASS,
  ADMIN_SIDEBAR_USER_CLASS,
  ADMIN_SCOPE_BADGE_CLASS,
  joinAdminClassNames
} from "@/components/admin/admin-tailwind";

type SidebarUser = {
  username: string;
  role: Role;
};

type NavItem = {
  label: string;
  href: string;
  roles: Role[];
};

type NavGroup = {
  key: string;
  label: string;
  Icon: ({ className }: { className?: string }) => ReactNode;
  roles: Role[];
  items: NavItem[];
};

function SidebarIconBase({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      {children}
    </svg>
  );
}

function DashboardSidebarIcon({ className }: { className?: string }) {
  return (
    <SidebarIconBase className={className}>
      <path d="M4 19V9.5L12 4l8 5.5V19" />
      <path d="M9 19v-5h6v5" />
    </SidebarIconBase>
  );
}

function DirectorySidebarIcon({ className }: { className?: string }) {
  return (
    <SidebarIconBase className={className}>
      <path d="M12 3v9" />
      <path d="M8 7h8" />
      <path d="M5 12a7 7 0 0 0 14 0" />
      <path d="M12 21a4 4 0 0 0 4-4H8a4 4 0 0 0 4 4Z" />
    </SidebarIconBase>
  );
}

function SearchSidebarIcon({ className }: { className?: string }) {
  return (
    <SidebarIconBase className={className}>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-3.5-3.5" />
    </SidebarIconBase>
  );
}

function MediaSidebarIcon({ className }: { className?: string }) {
  return (
    <SidebarIconBase className={className}>
      <rect x="3" y="5" width="14" height="10" rx="2" />
      <path d="M8 19h4" />
      <rect x="18" y="8" width="3" height="8" rx="1" />
    </SidebarIconBase>
  );
}

function AdministrationSidebarIcon({ className }: { className?: string }) {
  return (
    <SidebarIconBase className={className}>
      <path d="M12 3 5 6v5c0 4.6 2.8 7.7 7 10 4.2-2.3 7-5.4 7-10V6l-7-3Z" />
      <path d="m9.5 12 1.7 1.7 3.3-3.7" />
    </SidebarIconBase>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <SidebarIconBase className={className}>
      <path d="m6 9 6 6 6-6" />
    </SidebarIconBase>
  );
}

const DASHBOARD_ITEM: NavItem = {
  label: "Dashboard",
  href: "/admin",
  roles: ["ADMINISTRATOR", "OWNER"]
};

const navGroups: NavGroup[] = [
  {
    key: "directory",
    label: "Directory",
    Icon: DirectorySidebarIcon,
    roles: ["ADMINISTRATOR", "OWNER"],
    items: [
      { label: "Listings", href: "/admin/listings", roles: ["ADMINISTRATOR", "OWNER"] },
      { label: "Sections", href: "/admin/sections", roles: ["ADMINISTRATOR"] },
      { label: "Categories", href: "/admin/categories", roles: ["ADMINISTRATOR"] },
      { label: "Schemas", href: "/admin/schemas", roles: ["ADMINISTRATOR"] },
      { label: "Fields", href: "/admin/fields", roles: ["ADMINISTRATOR"] }
    ]
  },
  {
    key: "discovery",
    label: "Search",
    Icon: SearchSidebarIcon,
    roles: ["ADMINISTRATOR"],
    items: [{ label: "Search Suggestions", href: "/admin/search-suggestions", roles: ["ADMINISTRATOR"] }]
  },
  {
    key: "media",
    label: "Media",
    Icon: MediaSidebarIcon,
    roles: ["ADMINISTRATOR"],
    items: [
      { label: "Sliders", href: "/admin/sliders", roles: ["ADMINISTRATOR"] },
      { label: "Slides", href: "/admin/slides", roles: ["ADMINISTRATOR"] }
    ]
  },
  {
    key: "administration",
    label: "Administration",
    Icon: AdministrationSidebarIcon,
    roles: ["ADMINISTRATOR"],
    items: [
      { label: "Users", href: "/admin/users", roles: ["ADMINISTRATOR"] },
      { label: "UI Kit", href: "/admin/ui-kit", roles: ["ADMINISTRATOR"] }
    ]
  }
];

function isActivePath(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export default function AdminSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [openKeys, setOpenKeys] = useState<Set<string>>(() => {
    const activeGroup = navGroups.find((group) =>
      group.items.some((item) => item.roles.includes(user.role) && isActivePath(pathname, item.href))
    );

    return new Set(activeGroup ? [activeGroup.key] : []);
  });

  const normalizedQuery = query.trim().toLowerCase();
  const isDashboardVisible =
    DASHBOARD_ITEM.roles.includes(user.role) &&
    (normalizedQuery.length === 0 || DASHBOARD_ITEM.label.toLowerCase().includes(normalizedQuery));
  const filteredGroups = useMemo(
    () =>
      navGroups
        .filter((group) => group.roles.includes(user.role))
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

  const visibleOpenKeys = normalizedQuery.length > 0 ? new Set(filteredGroups.map((group) => group.key)) : openKeys;

  function toggleGroup(key: string) {
    if (normalizedQuery.length > 0) {
      return;
    }

    setOpenKeys((current) => {
      const next = new Set(current);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  }

  return (
    <aside className={ADMIN_SIDEBAR_CLASS}>
      <div className={ADMIN_SIDEBAR_BRAND_CLASS}>
        <Link href="/admin" className={ADMIN_BRAND_LINK_CLASS}>
          Porto Santo Guide Admin
        </Link>
        <div className={ADMIN_SIDEBAR_IDENTITY_CLASS}>
          <span className={ADMIN_SIDEBAR_USER_CLASS}>{user.username}</span>
          <span className={joinAdminClassNames(ADMIN_SCOPE_BADGE_CLASS, ADMIN_SIDEBAR_ROLE_CLASS)}>
            {user.role}
          </span>
        </div>
      </div>

      <div className={ADMIN_SIDEBAR_SEARCH_CLASS}>
        <label className="sr-only" htmlFor="admin-sidebar-search">
          Search admin navigation
        </label>
        <div className={ADMIN_SIDEBAR_SEARCH_FIELD_CLASS}>
          <SearchSidebarIcon className={ADMIN_SIDEBAR_SEARCH_ICON_CLASS} />
          <input
            id="admin-sidebar-search"
            className={ADMIN_SIDEBAR_SEARCH_INPUT_CLASS}
            placeholder="Search navigation"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className={ADMIN_SIDEBAR_NAV_SCROLL_CLASS}>
        <nav className={ADMIN_SIDEBAR_NAV_CLASS} aria-label="Admin navigation">
          {isDashboardVisible ? (
            <Link
              href={DASHBOARD_ITEM.href}
              className={joinAdminClassNames(
                ADMIN_SIDEBAR_ITEM_BASE_CLASS,
                isActivePath(pathname, DASHBOARD_ITEM.href) && ADMIN_SIDEBAR_ITEM_ACTIVE_CLASS
              )}
            >
              <DashboardSidebarIcon className={ADMIN_SIDEBAR_ICON_CLASS} />
              <span>{DASHBOARD_ITEM.label}</span>
            </Link>
          ) : null}

          <div className={ADMIN_SIDEBAR_ACCORDION_CLASS}>
            {filteredGroups.map((group) => {
              const GroupIcon = group.Icon;
              const isOpen = visibleOpenKeys.has(group.key);

              return (
                <div key={group.key}>
                  <button
                    aria-expanded={isOpen}
                    className={ADMIN_SIDEBAR_ACCORDION_TRIGGER_CLASS}
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                  >
                    <GroupIcon className={ADMIN_SIDEBAR_ICON_CLASS} />
                    <span className={ADMIN_SIDEBAR_ACCORDION_TITLE_CLASS}>{group.label}</span>
                    <ChevronIcon className={joinAdminClassNames(ADMIN_SIDEBAR_INDICATOR_CLASS, isOpen && "rotate-180")} />
                  </button>

                  {isOpen ? (
                    <div className={ADMIN_SIDEBAR_ACCORDION_CONTENT_CLASS}>
                      <div className={ADMIN_SIDEBAR_GROUP_NAV_CLASS}>
                        {group.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={joinAdminClassNames(
                              ADMIN_SIDEBAR_SUBITEM_CLASS,
                              isActivePath(pathname, item.href) && ADMIN_SIDEBAR_ITEM_ACTIVE_CLASS
                            )}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {!isDashboardVisible && filteredGroups.length === 0 ? (
            <p className={ADMIN_SIDEBAR_EMPTY_CLASS}>No navigation items match your search.</p>
          ) : null}
        </nav>
      </div>

      <div className={ADMIN_SIDEBAR_FOOTER_CLASS}>
        <AdminLogoutButton />
      </div>
    </aside>
  );
}
