import Link from "next/link";
import { notFound } from "next/navigation";
import DirectoryView from "@/components/DirectoryView";
import PublicBreadcrumbs from "@/components/frontend/PublicBreadcrumbs";
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
    <main className="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-5 md:py-10">
      <section className="mb-8 grid gap-3 max-[640px]:mb-6">
        <PublicBreadcrumbs
          items={[
            { href: `/${archive.category.sectionSlug}`, label: archive.category.sectionLabel },
            { label: archive.category.label }
          ]}
        />
        <h1 className="m-0 text-display-sm font-semibold tracking-[-0.04em] text-black max-[640px]:text-[2.5rem]">
          {archive.category.label}
        </h1>
        <p className="max-w-[46rem] text-xl text-black max-[640px]:text-lg">
          Discover curated places in Porto Santo, map-first and easy to explore.
        </p>
      </section>

      <DirectoryView
        listings={archive.listings}
        categorySchemaFields={archive.category.schema?.fields ?? []}
      />
    </main>
  );
}
