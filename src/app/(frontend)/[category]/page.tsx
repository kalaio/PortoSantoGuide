import { notFound } from "next/navigation";
import DirectoryBrowse from "@/components/DirectoryBrowse";
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
    <DirectoryBrowse
      breadcrumbs={[
        { href: `/${archive.category.sectionSlug}`, label: archive.category.sectionLabel },
        { label: archive.category.label }
      ]}
      categorySchemaFields={archive.category.schema?.fields ?? []}
      description="Discover curated places in Porto Santo, map-first and easy to explore."
      listings={archive.listings}
      title={archive.category.label}
    />
  );
}
