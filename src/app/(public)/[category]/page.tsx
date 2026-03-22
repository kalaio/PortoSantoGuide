import Link from "next/link";
import { notFound } from "next/navigation";
import DirectoryView from "@/components/DirectoryView";
import MaterialSymbolsStylesheet from "@/components/icons/material/MaterialSymbolsStylesheet";
import { getListingsByCategorySlug } from "@/lib/listings";

type CategoryArchivePageProps = {
  params: Promise<{ category: string }>;
};

export default async function CategoryArchivePage({ params }: CategoryArchivePageProps) {
  const { category: categorySlug } = await params;
  const archive = await getListingsByCategorySlug(categorySlug);

  if (!archive.category) {
    notFound();
  }

  return (
    <main className="page">
      <MaterialSymbolsStylesheet
        iconNames={[archive.category.iconName, ...archive.listings.map((item) => item.primaryCategory.iconName)]}
      />

      <section className="hero">
        <Link href={`/${archive.category.sectionSlug}`} className="muted">
          {archive.category.sectionLabel}
        </Link>
        <h1>{archive.category.label}</h1>
        <p>Discover curated places in Porto Santo, map-first and easy to explore.</p>
      </section>

      <DirectoryView
        listings={archive.listings}
        categorySchemaFields={archive.category.schema?.fields ?? []}
      />
    </main>
  );
}
