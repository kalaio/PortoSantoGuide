"use client";

import { ArrowLeft, ArrowRight, XClose } from "@untitledui/icons";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Carousel } from "@/components/application/carousel/carousel-base";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { cn } from "@/lib/cn";
import { getListingPhotoSectionLabel, groupListingPhotosBySection } from "@/lib/listing-photos";
import type { ListingPhoto, ListingPhotoSectionSummary } from "@/types/listing";

type ListingGalleryExperienceProps = {
  title: string;
  photos: ListingPhoto[];
  photoSections: ListingPhotoSectionSummary[];
};

const LISTING_GALLERY_OVERLAY_CLASS = "listingGalleryOverlayOpen";
const PUBLIC_THEME_ROOT_SELECTOR = ".publicThemeRoot";

function getPhotoIndexById(photos: ListingPhoto[], photoId: string | null) {
  if (!photoId) {
    return 0;
  }

  const index = photos.findIndex((photo) => photo.id === photoId);
  return index >= 0 ? index : 0;
}

export default function ListingGalleryExperience({
  title,
  photos,
  photoSections
}: ListingGalleryExperienceProps) {
  const [isSectionsOpen, setIsSectionsOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(photos[0]?.id ?? null);
  const [mobileHeroIndex, setMobileHeroIndex] = useState(0);
  const groupedPhotos = useMemo(() => groupListingPhotosBySection(photos, photoSections), [photoSections, photos]);
  const sectionRefs = useRef(new Map<string, HTMLElement>());
  const scrollbarCompensationRef = useRef(0);
  const isGalleryOverlayOpen = isSectionsOpen || isViewerOpen;

  useEffect(() => {
    const updateScrollbarCompensation = () => {
      if (isGalleryOverlayOpen) {
        return;
      }

      scrollbarCompensationRef.current = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    };

    updateScrollbarCompensation();
    window.addEventListener("resize", updateScrollbarCompensation);

    return () => {
      window.removeEventListener("resize", updateScrollbarCompensation);
    };
  }, [isGalleryOverlayOpen]);

  useEffect(() => {
    const html = document.documentElement;
    const publicThemeRoot = document.querySelector<HTMLElement>(PUBLIC_THEME_ROOT_SELECTOR);

    if (!isGalleryOverlayOpen) {
      html.classList.remove(LISTING_GALLERY_OVERLAY_CLASS);
      publicThemeRoot?.classList.remove(LISTING_GALLERY_OVERLAY_CLASS);
      publicThemeRoot?.style.removeProperty("--gallery-scrollbar-compensation");
      return;
    }

    const scrollbarCompensation =
      scrollbarCompensationRef.current || Math.max(0, window.innerWidth - document.documentElement.clientWidth);

    html.classList.add(LISTING_GALLERY_OVERLAY_CLASS);
    publicThemeRoot?.classList.add(LISTING_GALLERY_OVERLAY_CLASS);
    publicThemeRoot?.style.setProperty("--gallery-scrollbar-compensation", `${scrollbarCompensation}px`);

    return () => {
      html.classList.remove(LISTING_GALLERY_OVERLAY_CLASS);
      publicThemeRoot?.classList.remove(LISTING_GALLERY_OVERLAY_CLASS);
      publicThemeRoot?.style.removeProperty("--gallery-scrollbar-compensation");
    };
  }, [isGalleryOverlayOpen]);

  useEffect(() => {
    if (!selectedPhotoId) {
      setSelectedPhotoId(photos[0]?.id ?? null);
    }
  }, [photos, selectedPhotoId]);

  const selectedPhotoIndex = getPhotoIndexById(photos, selectedPhotoId);

  if (photos.length === 0) {
    return null;
  }

  return (
    <>
      <section className="grid gap-4">
        <Carousel.Root
          opts={{
            align: "start",
            loop: false,
            breakpoints: {
              "(min-width: 768px)": { active: false }
            }
          }}
          className="grid gap-3"
          setApi={(api) => {
            if (!api) {
              return;
            }

            setMobileHeroIndex(api.selectedScrollSnap());
            api.on("select", () => {
              setMobileHeroIndex(api.selectedScrollSnap());
            });
          }}
        >
          <div className="relative overflow-hidden bg-black/5 md:rounded-[0.75rem] md:bg-transparent">
            <Carousel.Content className="-ml-0 md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] md:grid-rows-[13.8rem_13.8rem] md:gap-2 md:bg-white">
              {photos.map((photo, index) => {
                const isPrimary = index === 0;
                const isDesktopHeroTile = index < 5;
                const showDesktopOverlay = index === 4 && photos.length > 5;

                return (
                  <Carousel.Item
                    key={photo.id}
                    className={cn(
                      "pl-0 md:min-w-0 md:basis-auto",
                      isPrimary && "md:col-[1/2] md:row-[1/3]",
                      !isDesktopHeroTile && "md:hidden"
                    )}
                  >
                    <button
                      type="button"
                      className={cn(
                        "relative block w-full cursor-pointer overflow-hidden bg-black/5 text-left",
                        isPrimary
                          ? "aspect-[4/3] md:h-full md:min-h-[28rem]"
                          : "aspect-[4/3] md:h-full md:min-h-[13.8rem]"
                      )}
                      onClick={() => {
                        setSelectedPhotoId(photo.id);
                        setIsSectionsOpen(true);
                      }}
                    >
                      <Image
                        src={photo.path}
                        alt={photo.alt ?? title}
                        fill
                        priority={isPrimary}
                        sizes={
                          isPrimary
                            ? "(min-width: 768px) 66vw, 100vw"
                            : isDesktopHeroTile
                              ? "(min-width: 768px) 17vw, 100vw"
                              : "100vw"
                        }
                        className="h-full w-full object-cover"
                      />
                      {showDesktopOverlay ? (
                        <div className="absolute inset-0 hidden items-end justify-end bg-gradient-to-t from-black/45 via-transparent to-transparent p-4 md:flex">
                          <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black shadow-sm">
                            Show all photos
                          </span>
                        </div>
                      ) : null}
                    </button>
                  </Carousel.Item>
                );
              })}
            </Carousel.Content>
            <div className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-black/65 px-3 py-1.5 text-sm font-medium text-white md:hidden">
              {mobileHeroIndex + 1} / {photos.length}
            </div>
          </div>
        </Carousel.Root>
      </section>

      <ModalOverlay
        isOpen={isSectionsOpen}
        isDismissable
        onOpenChange={setIsSectionsOpen}
        className="listingGalleryOverlay z-[120] !items-stretch !justify-stretch !p-0 bg-white/92 backdrop-blur-none"
      >
        <Modal className="!min-h-full !w-full !max-w-none rounded-none bg-white shadow-none">
          <Dialog className="!grid !min-h-full !w-full !grid-cols-[minmax(0,1fr)] !items-stretch !justify-start content-start bg-white">
            <div className="grid min-w-0 w-full grid-cols-[minmax(0,1fr)]">
              <div className="sticky top-0 z-30 border-b border-black/10 bg-white">
                <div className="flex h-16 items-center gap-1 px-3 md:h-[72px] md:gap-2 md:px-5 xl:px-5">
                  <button
                    type="button"
                    className="inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-black"
                    onClick={() => setIsSectionsOpen(false)}
                    aria-label="Close photos"
                  >
                    <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <p className="m-0 min-w-0 flex-1 truncate text-xl font-semibold text-black">
                    {title}
                  </p>
                </div>
              </div>

              <div className="grid min-w-0 gap-10 px-6 pb-10 pt-6 md:gap-12 md:px-10 md:pb-14 xl:px-14">
                <div className="mx-auto grid w-full max-w-[1120px] gap-3">
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {groupedPhotos.map(({ section, photos: sectionPhotos }) => {
                      const targetId = section?.id ?? "more-photos";
                      const previewPhoto = sectionPhotos[0];

                      return (
                        <button
                          key={targetId}
                          type="button"
                          className="grid w-28 shrink-0 cursor-pointer gap-2 text-left text-black sm:w-32"
                          onClick={() => {
                            sectionRefs.current.get(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                        >
                          <div className="relative aspect-[5/4] overflow-hidden rounded-[0.5rem] bg-black/5">
                            <Image
                              src={previewPhoto.thumbnailPath ?? previewPhoto.path}
                              alt={previewPhoto.alt ?? getListingPhotoSectionLabel(section)}
                              fill
                              sizes="(min-width: 640px) 8rem, 7rem"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <span className="text-sm font-medium leading-tight">{getListingPhotoSectionLabel(section)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mx-auto grid w-full max-w-[1120px] gap-12">
                  {groupedPhotos.map(({ section, photos: sectionPhotos }) => {
                    const sectionId = section?.id ?? "more-photos";

                    return (
                      <section
                        key={sectionId}
                        ref={(node) => {
                          if (node) {
                            sectionRefs.current.set(sectionId, node);
                          } else {
                            sectionRefs.current.delete(sectionId);
                          }
                        }}
                        className="grid min-w-0 gap-5 md:grid-cols-[220px_minmax(0,1fr)] md:gap-8 xl:grid-cols-[240px_minmax(0,1fr)]"
                      >
                        <div className="grid gap-1 self-start md:sticky md:top-28">
                          <h3 className="m-0 text-xl font-semibold tracking-[-0.04em] text-black">
                            {getListingPhotoSectionLabel(section)}
                          </h3>
                        </div>

                        <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          {sectionPhotos.map((photo) => (
                            <button
                              key={photo.id}
                              type="button"
                              className="grid cursor-pointer gap-3 text-left"
                              onClick={() => {
                                setSelectedPhotoId(photo.id);
                                setIsViewerOpen(true);
                              }}
                            >
                              <div className="relative overflow-hidden rounded-[0.5rem] bg-black/5">
                                <div className="relative aspect-[4/3] w-full">
                                  <Image
                                    src={photo.path}
                                    alt={photo.alt ?? title}
                                    fill
                                    sizes="(min-width: 1536px) 22rem, (min-width: 1280px) 20rem, (min-width: 768px) 24rem, 100vw"
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </div>
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>

      <PhotoViewerModal
        title={title}
        isOpen={isViewerOpen}
        photos={photos}
        initialIndex={selectedPhotoIndex}
        onClose={(photoId) => {
          setSelectedPhotoId(photoId);
          setIsViewerOpen(false);
        }}
      />
    </>
  );
}

function PhotoViewerModal({
  title,
  isOpen,
  photos,
  initialIndex,
  onClose
}: {
  title: string;
  isOpen: boolean;
  photos: ListingPhoto[];
  initialIndex: number;
  onClose: (photoId: string | null) => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const selectedPhoto = photos[selectedIndex] ?? null;

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(initialIndex);
    }
  }, [initialIndex, isOpen]);

  return (
    <ModalOverlay
      isOpen={isOpen}
      isDismissable
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose(selectedPhoto?.id ?? null);
        }
      }}
      className="listingGalleryOverlay z-[130] !items-stretch !justify-stretch !p-0 bg-black backdrop-blur-none"
    >
      <Modal className="!h-full !w-full !max-w-none rounded-none bg-black shadow-none">
        <Dialog className="!grid !h-full !w-full !grid-cols-[minmax(0,1fr)] !items-stretch !justify-start bg-black px-4 pb-6 pt-4 text-white md:px-8 md:pb-8 md:pt-6 xl:px-12">
          <div className="grid min-w-0 h-full w-full grid-rows-[auto_minmax(0,1fr)_auto] gap-4 md:gap-6">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-white"
                onClick={() => onClose(selectedPhoto?.id ?? null)}
              >
                <XClose className="h-4 w-4" aria-hidden="true" />
                Close
              </button>
              <p className="m-0 text-sm font-medium text-white/80">
                {selectedIndex + 1} / {photos.length}
              </p>
              <div className="w-[88px]" aria-hidden="true" />
            </div>

            <Carousel.Root
              opts={{ align: "center", loop: false, startIndex: initialIndex }}
              className="grid min-w-0 h-full w-full items-center"
              setApi={(api) => {
                if (!api) {
                  return;
                }

                setSelectedIndex(api.selectedScrollSnap());
                api.on("select", () => {
                  setSelectedIndex(api.selectedScrollSnap());
                });
              }}
            >
              <div className="relative grid min-w-0 h-full w-full items-center">
                <Carousel.Content className="items-center">
                  {photos.map((photo) => (
                    <Carousel.Item key={photo.id} className="grid min-w-0 place-items-center px-12 md:px-20">
                      <div className="relative h-[min(78vh,1000px)] w-full max-w-[1760px]">
                        <Image
                          src={photo.path}
                          alt={photo.alt ?? title}
                          fill
                          sizes="(min-width: 768px) calc(100vw - 10rem), calc(100vw - 6rem)"
                          className="h-full w-full object-contain"
                        />
                      </div>
                    </Carousel.Item>
                  ))}
                </Carousel.Content>

                <Carousel.PrevTrigger className="absolute left-2 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full border border-white/20 bg-white/10 p-3 text-white backdrop-blur-sm transition disabled:cursor-default disabled:opacity-30 md:left-6">
                  <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                </Carousel.PrevTrigger>
                <Carousel.NextTrigger className="absolute right-2 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full border border-white/20 bg-white/10 p-3 text-white backdrop-blur-sm transition disabled:cursor-default disabled:opacity-30 md:right-6">
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Carousel.NextTrigger>
              </div>
            </Carousel.Root>

            {selectedPhoto ? (
              <div className="grid w-full gap-1 text-white/80">
                <p className="m-0 text-sm font-semibold">{getListingPhotoSectionLabel(selectedPhoto.section)}</p>
                <p className={cn("m-0 text-sm", !selectedPhoto.alt && "text-white/55")}>{selectedPhoto.alt ?? title}</p>
              </div>
            ) : null}
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
