"use client";

import { useEffect, useMemo, useState, type FocusEvent, type Ref } from "react";
import { ArrowLeft, ArrowRight, Map01 } from "@untitledui/icons";
import Image from "next/image";
import Link from "next/link";
import { Carousel } from "@/components/application/carousel/carousel-base";
import PublicFilterButton from "@/components/frontend/PublicFilterButton";
import type { ListingMapHandle, MapBounds } from "@/components/ListingMap";
import ListingMapLazy from "@/components/ListingMapLazy";
import { cn } from "@/lib/cn";
import { getDetailsSummaryByFields } from "@/lib/listing-details";
import { getListingPath } from "@/lib/listing-path";
import type { Listing, ListingPhoto } from "@/types/listing";

type DirectoryViewProps = {
  hasVisibleFilters: boolean;
  isMobileViewport: boolean;
  mapHandleRef?: Ref<ListingMapHandle>;
  mappableListings: Listing[];
  mobileViewMode: "list" | "map";
  onHoverListingChange: (listingId: string | null) => void;
  onSearchInArea: (bounds: MapBounds) => void;
  onToggleMobileViewMode: () => void;
  showMap: boolean;
  visibleListings: Listing[];
};

function getListingPreviewPhotos(listing: Listing): ListingPhoto[] {
  if (listing.photos.length > 0) {
    return listing.photos;
  }

  return listing.coverPhoto ? [listing.coverPhoto] : [];
}

type DirectoryListingCardProps = {
  detailsSummary: string;
  listing: Listing;
  onFocusListing: () => void;
  onBlurListing: (event: FocusEvent<HTMLElement>) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

function DirectoryListingCard({ detailsSummary, listing, onBlurListing, onFocusListing, onMouseEnter, onMouseLeave }: DirectoryListingCardProps) {
  const previewPhotos = getListingPreviewPhotos(listing);
  const listingPath = getListingPath(listing);

  return (
    <article
      className="overflow-hidden rounded-[1rem] border border-black/10 bg-white transition"
      onFocusCapture={onFocusListing}
      onBlurCapture={onBlurListing}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="grid min-w-0 grid-cols-1 md:grid-cols-[16rem_minmax(0,1fr)]">
        {previewPhotos.length > 0 ? (
          <div className="relative border-b border-black/8 bg-black/[0.02] md:min-h-[13.5rem] md:border-b-0 md:border-r md:border-black/8">
            <Carousel.Root opts={{ align: "start", loop: false }} className="h-full">
              <Carousel.Content className="h-full">
                {previewPhotos.map((photo) => (
                  <Carousel.Item key={photo.id} className="basis-full">
                    <div className="relative aspect-[16/9] h-full bg-black/5 sm:aspect-[16/10] md:min-h-[13.5rem] md:aspect-auto">
                      <Image
                        src={photo.thumbnailPath ?? photo.path}
                        alt={photo.alt ?? listing.title}
                        fill
                        sizes="(min-width: 768px) 16rem, 100vw"
                        className="h-full w-full object-cover"
                      />
                      <Link href={listingPath} className="absolute inset-0 z-10" aria-label={`Open ${listing.title}`} />
                    </div>
                  </Carousel.Item>
                ))}
              </Carousel.Content>

              {previewPhotos.length > 1 ? (
                <>
                  <Carousel.PrevTrigger className={({ isDisabled }) => cn(
                    "absolute left-3 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition",
                    isDisabled ? "pointer-events-none opacity-30" : "cursor-pointer hover:bg-black/68"
                  )}>
                    <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                  </Carousel.PrevTrigger>
                  <Carousel.NextTrigger className={({ isDisabled }) => cn(
                    "absolute right-3 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition",
                    isDisabled ? "pointer-events-none opacity-30" : "cursor-pointer hover:bg-black/68"
                  )}>
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </Carousel.NextTrigger>
                </>
              ) : null}
            </Carousel.Root>
          </div>
        ) : null}

        <Link href={listingPath} className="grid h-full min-w-0 content-start gap-1 px-5 py-4 text-black no-underline">
          <h3 className="m-0 truncate text-md font-semibold text-black">{listing.title}</h3>
          <p className="m-0 text-sm leading-snug text-[color:var(--psg-text-secondary)]">{listing.categories.map((item) => item.label).join(" · ")}</p>
          {detailsSummary ? <p className="m-0 text-sm leading-snug text-[color:var(--psg-text-secondary)]">{detailsSummary}</p> : null}
        </Link>
      </div>
    </article>
  );
}

export default function DirectoryView({
  hasVisibleFilters,
  isMobileViewport,
  mapHandleRef,
  mappableListings,
  mobileViewMode,
  onHoverListingChange,
  onSearchInArea,
  onToggleMobileViewMode,
  showMap,
  visibleListings,
}: DirectoryViewProps) {
  const isMobileMapMode = showMap && isMobileViewport && mobileViewMode === "map";
  const shouldRenderMobileMap = showMap && isMobileViewport;
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);
  const listingSummariesById = useMemo(() => {
    const summaries = new Map<string, string>();

    visibleListings.forEach((listing) => {
      summaries.set(listing.id, getDetailsSummaryByFields(listing.primaryCategory.schema?.fields, listing.details));
    });

    return summaries;
  }, [visibleListings]);

  useEffect(() => {
    if (hoveredListingId && !visibleListings.some((listing) => listing.id === hoveredListingId)) {
      setHoveredListingId(null);
      onHoverListingChange(null);
    }
  }, [hoveredListingId, onHoverListingChange, visibleListings]);

  return (
    <section className={cn(isMobileMapMode && "block")}>
      <aside className={cn(isMobileMapMode && "hidden")}>
        <div className="grid gap-3">
          {visibleListings.map((listing) => {
            const detailsSummary = listingSummariesById.get(listing.id) ?? "";

            return (
              <DirectoryListingCard
                key={listing.id}
                detailsSummary={detailsSummary}
                listing={listing}
                onBlurListing={(event) => {
                  if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    return;
                  }

                  setHoveredListingId(null);
                  onHoverListingChange(null);
                }}
                onFocusListing={() => {
                  setHoveredListingId(listing.id);
                  onHoverListingChange(listing.id);
                }}
                onMouseEnter={() => {
                  setHoveredListingId(listing.id);
                  onHoverListingChange(listing.id);
                }}
                onMouseLeave={() => {
                  setHoveredListingId(null);
                  onHoverListingChange(null);
                }}
              />
            );
          })}
          {visibleListings.length === 0 ? (
            <p className="rounded-[1rem] border border-dashed border-gray-300 bg-white px-5 py-8 text-md text-gray-500">
              No places in this area.
            </p>
          ) : null}
        </div>
      </aside>

      {shouldRenderMobileMap ? (
        <div
          className={cn(
            "min-h-[44rem] overflow-hidden bg-white",
            isMobileMapMode
              ? cn(
                  "max-[900px]:fixed max-[900px]:inset-x-0 max-[900px]:bottom-0 max-[900px]:z-20 max-[900px]:block max-[900px]:min-h-0 max-[900px]:rounded-none",
                  hasVisibleFilters ? "max-[900px]:top-[60px]" : "max-[900px]:top-0"
                )
              : "max-[900px]:hidden"
          )}
        >
          <ListingMapLazy isVisible={isMobileMapMode} mapHandleRef={mapHandleRef} mobileCardMode listings={mappableListings} onSearchInArea={onSearchInArea} />
        </div>
      ) : null}

      {showMap ? (
        <PublicFilterButton
          aria-label={mobileViewMode === "map" ? "Show list" : "Show map"}
          aria-pressed={mobileViewMode === "map"}
          className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-30 hidden min-w-[120px] -translate-x-1/2 justify-center border-0 bg-[var(--psg-brand-secondary)] px-8 text-white ring-0 *:data-text:text-white *:data-icon:text-white hover:bg-[var(--psg-brand-secondary-hover)] hover:text-white hover:*:data-text:text-white hover:*:data-icon:text-white max-[900px]:inline-flex"
          iconLeading={mobileViewMode === "map" ? undefined : Map01}
          onClick={onToggleMobileViewMode}
          size="md"
        >
          {mobileViewMode === "map" ? "List" : "Map"}
        </PublicFilterButton>
      ) : null}
    </section>
  );
}
