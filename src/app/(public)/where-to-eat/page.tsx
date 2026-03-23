import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectIcon from "@/components/icons/ProjectIcon";
import { getSectionSummaryBySlug } from "@/lib/listings";

export default async function WhereToEatPage() {
  const section = await getSectionSummaryBySlug("where-to-eat");

  if (!section) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-[1280px] px-5 py-10 max-[640px]:px-3 max-[640px]:py-6">
      <section className="mb-8 grid gap-3 max-[640px]:mb-6">
        <h1 className="m-0 text-display-sm font-semibold tracking-[-0.04em] text-gray-950 max-[640px]:text-[2.5rem]">{section.label}</h1>
        <p className="max-w-[44rem] text-xl text-gray-600 max-[640px]:text-lg">
          From traditional kitchens to quick bites, browse Porto Santo food spots by type.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {section.categories.map((category) => (
          <Link
            key={category.slug}
            href={`/${encodeURIComponent(category.slug)}`}
            className="grid gap-4 rounded-[1.75rem] border border-gray-warm-200 bg-white px-6 py-6 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <ProjectIcon iconName={category.iconName} className="h-6 w-6" />
            </span>
            <strong className="inline-flex items-center gap-3 text-[1.35rem] font-semibold text-gray-950">
              <span>{category.label}</span>
            </strong>
            <p className="text-base text-gray-500">{category.listingCount} places</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
