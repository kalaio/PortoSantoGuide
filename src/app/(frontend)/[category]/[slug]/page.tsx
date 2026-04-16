import { notFound } from "next/navigation";
import ExpandableDescription from "@/components/ExpandableDescription";
import PublicBreadcrumbs from "@/components/frontend/PublicBreadcrumbs";
import ListingMapLazy from "@/components/ListingMapLazy";
import {
  FOOD_OPENING_HOURS_DAY_KEYS,
  FOOD_OPENING_HOURS_DAY_LABELS,
  formatFoodOpeningIntervals,
  getDetailsEntriesByFields,
  getDetailsSummaryByFields,
  getFoodOpeningHoursWeek,
  getFoodOpeningState,
  getFoodOpeningStatus,
  hasSchemaField
} from "@/lib/listing-details";
import { getListingByCategoryAndSlug } from "@/lib/listings";

type ListingDetailPageProps = {
  params: Promise<{ category: string; slug: string }>;
};

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { category: categorySlug, slug } = await params;
  const listing = await getListingByCategoryAndSlug(categorySlug, slug);

  if (!listing) {
    notFound();
  }

  const detailsSummary = getDetailsSummaryByFields(listing.primaryCategory.schema?.fields, listing.details);
  const detailsEntries = getDetailsEntriesByFields(listing.primaryCategory.schema?.fields, listing.details);
  const hasLocationField = hasSchemaField(listing.primaryCategory.schema?.fields, "location");
  const openingStatusTime = new Date();
  const foodOpeningHoursWeek = hasSchemaField(listing.primaryCategory.schema?.fields, "openingHours")
    ? getFoodOpeningHoursWeek(listing.details)
    : null;
  const foodOpeningStatus = foodOpeningHoursWeek
    ? getFoodOpeningStatus(listing.details, openingStatusTime)
    : null;
  const foodOpeningState = foodOpeningHoursWeek
    ? getFoodOpeningState(listing.details, openingStatusTime)
    : null;

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 pt-4 pb-6 md:px-5 md:pt-6 md:pb-10">
      <section className="mb-8 grid gap-2 max-[640px]:mb-6">
        <PublicBreadcrumbs
          items={[
            { href: `/${listing.primaryCategory.sectionSlug}`, label: listing.primaryCategory.sectionLabel },
            { href: `/${listing.primaryCategory.slug}`, label: listing.primaryCategory.label },
            { label: listing.title }
          ]}
        />
        <h1 className="m-0 text-display-sm font-semibold tracking-[-0.04em] text-black">
          {listing.title}
        </h1>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
        <article className="grid gap-5 rounded-[1.75rem] border border-black/10 bg-white p-6 max-[640px]:rounded-[1.5rem] max-[640px]:p-5">
          <div className="grid gap-2">
            <h2 className="m-0 text-display-xs font-semibold tracking-[-0.04em] text-black">About this place</h2>
            {listing.description ? (
              <ExpandableDescription text={listing.description} />
            ) : (
              <p className="text-sm text-[color:var(--psg-text-secondary)]">No description available.</p>
            )}
          </div>

          <div className="grid gap-2">
            <h2 className="m-0 text-display-xs font-semibold tracking-[-0.04em] text-black">Categories</h2>
            <p className="text-md text-[color:var(--psg-text-secondary)]">{listing.categories.map((category) => category.label).join(" · ")}</p>
          </div>

          {detailsSummary ? (
            <div className="grid gap-2">
              <h2 className="m-0 text-display-xs font-semibold tracking-[-0.04em] text-black">Highlights</h2>
              <p className="text-md text-[color:var(--psg-text-secondary)]">{detailsSummary}</p>
            </div>
          ) : null}

          {foodOpeningHoursWeek ? (
            <div className="grid gap-2">
              <h2 className="m-0 text-display-xs font-semibold tracking-[-0.04em] text-black">Opening hours</h2>
              <div className="grid gap-4 rounded-3xl border border-black/10 bg-gray-50 p-5">
                <p className={`m-0 font-semibold ${foodOpeningState === "closed" ? "text-brand-800" : "text-brand-700"}`}>
                  {foodOpeningStatus ?? "Closed"}
                </p>
                <div className="grid gap-2.5">
                  {FOOD_OPENING_HOURS_DAY_KEYS.map((dayKey) => {
                    const intervals = foodOpeningHoursWeek[dayKey];

                    return (
                      <div key={dayKey} className="grid gap-1 min-[641px]:grid-cols-[minmax(6rem,7rem)_1fr] min-[641px]:items-start">
                        <span className="font-semibold text-brand-900">{FOOD_OPENING_HOURS_DAY_LABELS[dayKey]}</span>
                        <span className="text-brand-800">
                          {intervals.length > 0 ? formatFoodOpeningIntervals(intervals) : "Closed"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-2">
            <h2 className="m-0 text-display-xs font-semibold tracking-[-0.04em] text-black">Details</h2>
            {detailsEntries.length > 0 ? (
              detailsEntries.map((entry) => (
                <p key={entry.label} className="text-md text-[color:var(--psg-text-secondary)]">
                  {entry.label}: {entry.value}
                </p>
              ))
            ) : (
              <p className="text-md text-[color:var(--psg-text-secondary)]">No extra details yet.</p>
            )}
          </div>

          {hasLocationField && listing.latitude !== null && listing.longitude !== null ? (
            <div className="grid gap-2">
              <h2 className="m-0 text-display-xs font-semibold tracking-[-0.04em] text-black">Coordinates</h2>
              <p className="text-md text-[color:var(--psg-text-secondary)]">
                {listing.latitude.toFixed(6)}, {listing.longitude.toFixed(6)}
              </p>
            </div>
          ) : null}
        </article>

        {hasLocationField && listing.latitude !== null && listing.longitude !== null ? (
          <div className="min-h-[60vh] overflow-hidden rounded-[1.75rem] border border-black/10 bg-white max-[640px]:min-h-[55vh] max-[640px]:rounded-[1.5rem]">
            <ListingMapLazy listings={[listing]} />
          </div>
        ) : null}
      </section>
    </main>
  );
}
