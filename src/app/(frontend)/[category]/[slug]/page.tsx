import { notFound } from "next/navigation";
import ExpandableDescription from "@/components/ExpandableDescription";
import PublicBreadcrumbs from "@/components/frontend/PublicBreadcrumbs";
import ListingDetailSectionNav from "@/components/ListingDetailSectionNav";
import ListingGalleryExperience from "@/components/ListingGalleryExperience";
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
  const hasPhotos = listing.photos.length > 0;
  const hasOpeningHours = Boolean(foodOpeningHoursWeek);
  const hasLocation = hasLocationField && listing.latitude !== null && listing.longitude !== null;
  const detailNavigationItems = [
    { id: "overview", label: "Overview" },
    { id: "details", label: "Details" },
    ...(hasOpeningHours ? [{ id: "opening-hours", label: "Opening hours" }] : []),
    ...(hasLocation ? [{ id: "location", label: "Location" }] : [])
  ];
  const navigationItems = [
    ...(hasPhotos ? [{ id: "photos", label: "Photos" }] : []),
    ...detailNavigationItems
  ];

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 pt-4 pb-6 md:px-5 md:pt-6 md:pb-10">
      <section className="mb-6 grid gap-3">
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

      {hasPhotos ? (
        <section id="photos" className="mb-8 scroll-mt-36 max-[640px]:mb-6 md:scroll-mt-40">
          <ListingGalleryExperience
            title={listing.title}
            photos={listing.photos}
            photoSections={listing.photoSections}
          />
        </section>
      ) : null}

      <ListingDetailSectionNav items={navigationItems} sentinelId={hasPhotos ? "photos" : undefined} title={listing.title} />

      <div className="grid gap-8 pt-8 md:pt-10">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
          <div className="grid gap-6">
            <article id="overview" className="grid gap-6 scroll-mt-36 md:scroll-mt-40">
              <div className="grid gap-2">
                <h2 className="m-0 text-display-xs font-semibold tracking-[-0.04em] text-black">Overview</h2>
                {listing.description ? (
                  <ExpandableDescription text={listing.description} />
                ) : (
                  <p className="text-sm text-[color:var(--psg-text-secondary)]">No description available.</p>
                )}
              </div>

              <div className="grid gap-2">
                <h3 className="m-0 text-lg font-semibold tracking-[-0.03em] text-black">Categories</h3>
                <p className="text-md text-[color:var(--psg-text-secondary)]">{listing.categories.map((category) => category.label).join(" · ")}</p>
              </div>

              {detailsSummary ? (
                <div className="grid gap-2">
                  <h3 className="m-0 text-lg font-semibold tracking-[-0.03em] text-black">Highlights</h3>
                  <p className="text-md text-[color:var(--psg-text-secondary)]">{detailsSummary}</p>
                </div>
              ) : null}
            </article>

            <article id="details" className="grid gap-4 scroll-mt-36 md:scroll-mt-40">
              <h2 className="m-0 text-display-xs font-semibold tracking-[-0.04em] text-black">Details</h2>
              {detailsEntries.length > 0 ? (
                <div className="grid gap-3">
                  {detailsEntries.map((entry) => (
                    <div
                      key={entry.label}
                      className="grid gap-1 border-b border-black/8 pb-3 last:border-0 last:pb-0 sm:grid-cols-[minmax(9rem,11rem)_1fr] sm:gap-4"
                    >
                      <span className="text-sm font-semibold text-black">{entry.label}</span>
                      <span className="text-sm text-[color:var(--psg-text-secondary)]">{entry.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-md text-[color:var(--psg-text-secondary)]">No extra details yet.</p>
              )}
            </article>
          </div>

          {hasOpeningHours ? (
            <aside className="xl:mt-10">
              <section id="opening-hours" className="grid gap-4 scroll-mt-36 md:scroll-mt-40">
                <h2 className="m-0 text-display-xs font-semibold tracking-[-0.04em] text-black">Opening hours</h2>
                <div className="grid gap-4">
                  <p className={`m-0 font-semibold ${foodOpeningState === "closed" ? "text-brand-800" : "text-brand-700"}`}>
                    {foodOpeningStatus ?? "Closed"}
                  </p>
                  <div className="grid gap-2.5">
                    {FOOD_OPENING_HOURS_DAY_KEYS.map((dayKey) => {
                      const intervals = foodOpeningHoursWeek?.[dayKey] ?? [];

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
              </section>
            </aside>
          ) : null}
        </section>

        {hasLocation ? (
          <section id="location" className="grid gap-4 scroll-mt-36 md:scroll-mt-40">
            <div className="grid gap-2">
              <h2 className="m-0 text-display-xs font-semibold tracking-[-0.04em] text-black">Location</h2>
            </div>

            <div className="min-h-[60vh] overflow-hidden rounded-[1.75rem] border border-black/10 bg-white max-[640px]:min-h-[55vh] max-[640px]:rounded-[1.5rem]">
              <ListingMapLazy allowScrollWheelZoom={false} listings={[listing]} />
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
