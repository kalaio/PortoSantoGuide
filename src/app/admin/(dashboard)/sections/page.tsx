import Link from "next/link";
import { Button } from "@/components/base/buttons/button";
import {
  ADMIN_HEADER_ACTIONS_CLASS,
  ADMIN_HEADER_ROW_CLASS,
  ADMIN_HERO_CLASS,
  ADMIN_LIST_GRID_CLASS,
  ADMIN_LIST_ITEM_CLASS,
  ADMIN_LIST_LINK_CLASS,
  ADMIN_PAGE_CLASS,
  ADMIN_PANEL_CLASS,
  ADMIN_STATUS_MESSAGE_CLASS,
  ADMIN_TITLE_CLASS
} from "@/components/admin/admin-tailwind";
import { requireServerUserWithRole } from "@/lib/admin-auth-server";
import { getAdminSections } from "@/lib/admin-sections";

export default async function AdminSectionsPage() {
  const user = await requireServerUserWithRole(["ADMINISTRATOR"]);
  const sections = await getAdminSections(user);

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

      <section className={ADMIN_PANEL_CLASS}>
        <div className={ADMIN_LIST_GRID_CLASS}>
          {sections.map((section) => (
            <Link key={section.id} className={ADMIN_LIST_LINK_CLASS} href={`/admin/sections/${section.id}/edit`}>
              <article className={ADMIN_LIST_ITEM_CLASS}>
                <h3>{section.label}</h3>
                <p className="muted">{section.slug}</p>
                <p className="muted">Sort order: {section.sortOrder}</p>
                <p className="muted">Status: {section.isActive ? "Active" : "Inactive"}</p>
              </article>
            </Link>
          ))}
        </div>
        {sections.length === 0 ? <p className={ADMIN_STATUS_MESSAGE_CLASS}>No sections found yet. Create your first section.</p> : null}
      </section>
    </main>
  );
}
