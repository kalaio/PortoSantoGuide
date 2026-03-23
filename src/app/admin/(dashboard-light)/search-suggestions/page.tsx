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
import { prisma } from "@/lib/prisma";

export default async function AdminSearchSuggestionsPage() {
  await requireServerUserWithRole(["ADMINISTRATOR"]);

  const suggestions = await prisma.searchSuggestion.findMany({
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }]
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

      <section className={ADMIN_PANEL_CLASS}>
        <div className={ADMIN_LIST_GRID_CLASS}>
          {suggestions.map((suggestion) => (
            <Link
              key={suggestion.id}
              className={ADMIN_LIST_LINK_CLASS}
              href={`/admin/search-suggestions/${suggestion.id}/edit`}
            >
              <article className={ADMIN_LIST_ITEM_CLASS}>
                <h3>{suggestion.label}</h3>
                <p className="muted">Query: {suggestion.query}</p>
                <p className="muted">Priority: {suggestion.priority}</p>
                <p className="muted">Status: {suggestion.isActive ? "Active" : "Inactive"}</p>
              </article>
            </Link>
          ))}
        </div>
        {suggestions.length === 0 ? (
          <p className={ADMIN_STATUS_MESSAGE_CLASS}>No search suggestions found yet. Create your first search suggestion.</p>
        ) : null}
      </section>
    </main>
  );
}
