import Link from "next/link";
import { notFound } from "next/navigation";
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
    <main className="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-5 md:py-10">
      <section className="mb-8 grid gap-2 max-[640px]:mb-6">
        <Link href={`/${listing.primaryCategory.sectionSlug}`} className="text-lg text-gray-500 max-[640px]:text-base">
          {listing.primaryCategory.sectionLabel}
        </Link>
        <Link href={`/${listing.primaryCategory.slug}`} className="text-lg text-gray-500 max-[640px]:text-base">
          {listing.primaryCategory.label}
        </Link>
        <h1 className="m-0 text-display-sm font-semibold tracking-[-0.04em] text-gray-950 max-[640px]:text-[2.5rem]">
          {listing.title}
        </h1>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
        <article className="grid gap-5 rounded-[1.75rem] border border-gray-200 bg-white p-6 shadow-sm max-[640px]:rounded-[1.5rem] max-[640px]:p-5">
          <div className="grid gap-2">
            <h2 className="m-0 text-[2rem] font-semibold tracking-[-0.04em] text-gray-950 max-[640px]:text-[1.7rem]">About this place</h2>
          {listing.description ? (
              <p className="text-lg leading-8 text-brand-800 max-[640px]:text-base max-[640px]:leading-7">{listing.description}</p>
          ) : (
              <p className="text-base text-gray-500">No description available.</p>
          )}
          </div>

          <div className="grid gap-2">
            <h2 className="m-0 text-[2rem] font-semibold tracking-[-0.04em] text-gray-950 max-[640px]:text-[1.7rem]">Categories</h2>
            <p className="text-base text-gray-500">{listing.categories.map((category) => category.label).join(" · ")}</p>
          </div>

          {detailsSummary ? (
            <div className="grid gap-2">
              <h2 className="m-0 text-[2rem] font-semibold tracking-[-0.04em] text-gray-950 max-[640px]:text-[1.7rem]">Highlights</h2>
              <p className="text-base text-gray-500">{detailsSummary}</p>
            </div>
          ) : null}

          {foodOpeningHoursWeek ? (
            <div className="grid gap-2">
              <h2 className="m-0 text-[2rem] font-semibold tracking-[-0.04em] text-gray-950 max-[640px]:text-[1.7rem]">Opening hours</h2>
              <div className="grid gap-4 rounded-3xl border border-gray-200 bg-gray-50 p-5">
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
            <h2 className="m-0 text-[2rem] font-semibold tracking-[-0.04em] text-gray-950 max-[640px]:text-[1.7rem]">Details</h2>
            {detailsEntries.length > 0 ? (
              detailsEntries.map((entry) => (
                <p key={entry.label} className="text-base text-gray-500">
                  {entry.label}: {entry.value}
                </p>
              ))
            ) : (
              <p className="text-base text-gray-500">No extra details yet.</p>
            )}
          </div>

          {hasLocationField && listing.latitude !== null && listing.longitude !== null ? (
            <div className="grid gap-2">
              <h2 className="m-0 text-[2rem] font-semibold tracking-[-0.04em] text-gray-950 max-[640px]:text-[1.7rem]">Coordinates</h2>
              <p className="text-base text-gray-500">
                {listing.latitude.toFixed(6)}, {listing.longitude.toFixed(6)}
              </p>
            </div>
          ) : null}
        </article>

        {hasLocationField && listing.latitude !== null && listing.longitude !== null ? (
          <div className="overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white shadow-sm min-h-[60vh] max-[640px]:min-h-[55vh] max-[640px]:rounded-[1.5rem]">
            <ListingMapLazy listings={[listing]} hoveredListingId={null} />
          </div>
        ) : null}
      </section>
    </main>
  );
}
