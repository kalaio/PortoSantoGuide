import Link from "next/link";
import { notFound } from "next/navigation";
import CategoryIcon from "@/components/icons/material/CategoryIcon";
import MaterialSymbolsStylesheet from "@/components/icons/material/MaterialSymbolsStylesheet";
import { getSectionSummaryBySlug } from "@/lib/listings";

export default async function WhereToEatPage() {
  const section = await getSectionSummaryBySlug("where-to-eat");

  if (!section) {
    notFound();
  }

  return (
    <main className="page">
      <MaterialSymbolsStylesheet iconNames={section.categories.map((category) => category.iconName)} />

      <section className="hero">
        <h1>{section.label}</h1>
        <p>From traditional kitchens to quick bites, browse Porto Santo food spots by type.</p>
      </section>

      <section className="publicLinkGrid">
        {section.categories.map((category) => (
          <Link
            key={category.slug}
            href={`/${encodeURIComponent(category.slug)}`}
            className="publicLinkCard"
          >
            <strong className="categoryCardLabel">
              <CategoryIcon iconName={category.iconName} className="categoryCardIcon" />
              <span>{category.label}</span>
            </strong>
            <p className="muted">{category.listingCount} places</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
