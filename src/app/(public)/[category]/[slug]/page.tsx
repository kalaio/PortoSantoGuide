import Link from "next/link";
import { notFound } from "next/navigation";
import MaterialSymbolsStylesheet from "@/components/icons/material/MaterialSymbolsStylesheet";
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
    <main className="page">
      <MaterialSymbolsStylesheet iconNames={[listing.primaryCategory.iconName]} />

      <section className="hero">
        <Link href={`/${listing.primaryCategory.sectionSlug}`} className="muted">
          {listing.primaryCategory.sectionLabel}
        </Link>
        <Link href={`/${listing.primaryCategory.slug}`} className="muted">
          {listing.primaryCategory.label}
        </Link>
        <h1>{listing.title}</h1>
      </section>

      <section className="detailGrid">
        <article className="panel">
          <h2>About this place</h2>
          {listing.description ? (
            <p className="detailText">{listing.description}</p>
          ) : (
            <p className="muted">No description available.</p>
          )}

          <h2>Categories</h2>
          <p className="muted">{listing.categories.map((category) => category.label).join(" · ")}</p>

          {detailsSummary ? (
            <>
              <h2>Highlights</h2>
              <p className="muted">{detailsSummary}</p>
            </>
          ) : null}

          {foodOpeningHoursWeek ? (
            <>
              <h2>Opening hours</h2>
              <div className="detailHoursCard">
                <p className={`detailHoursStatus${foodOpeningState === "closed" ? " isClosed" : ""}`}>
                  {foodOpeningStatus ?? "Closed"}
                </p>
                <div className="detailHoursRows">
                  {FOOD_OPENING_HOURS_DAY_KEYS.map((dayKey) => {
                    const intervals = foodOpeningHoursWeek[dayKey];

                    return (
                      <div key={dayKey} className="detailHoursRow">
                        <span className="detailHoursDay">{FOOD_OPENING_HOURS_DAY_LABELS[dayKey]}</span>
                        <span className="detailHoursValue">
                          {intervals.length > 0 ? formatFoodOpeningIntervals(intervals) : "Closed"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}

          <h2>Details</h2>
          {detailsEntries.length > 0 ? (
            detailsEntries.map((entry) => (
              <p key={entry.label} className="muted">
                {entry.label}: {entry.value}
              </p>
            ))
          ) : (
            <p className="muted">No extra details yet.</p>
          )}

          {hasLocationField && listing.latitude !== null && listing.longitude !== null ? (
            <>
              <h2>Coordinates</h2>
              <p className="muted">
                {listing.latitude.toFixed(6)}, {listing.longitude.toFixed(6)}
              </p>
            </>
          ) : null}
        </article>

        {hasLocationField && listing.latitude !== null && listing.longitude !== null ? (
          <div className="mapWrap detailMapWrap">
            <ListingMapLazy listings={[listing]} hoveredListingId={null} />
          </div>
        ) : null}
      </section>
    </main>
  );
}
