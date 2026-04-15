"use client";

import { Image01, Menu02, XClose } from "@untitledui/icons";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import GlobalSearch from "@/app/(frontend)/components/GlobalSearch";
import MenuOverlay from "@/app/(frontend)/components/MenuOverlay";
import type { PublicMenuLink } from "@/lib/listings";
import type { SlideMedia } from "@/lib/slides";

type HomeHeroProps = {
  slides: SlideMedia[];
  menuLinks: PublicMenuLink[];
};

export default function HomeHero({ slides, menuLinks }: HomeHeroProps) {
  const usableSlides = useMemo(
    () =>
      slides.filter(
        (slide) => Boolean(slide.mediaDesktop || slide.mediaMobile || slide.videoUrl)
      ),
    [slides]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isThumbnailTrayOpen, setIsThumbnailTrayOpen] = useState(false);

  useEffect(() => {
    if (activeIndex >= usableSlides.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, usableSlides.length]);

  useEffect(() => {
    if (previousIndex === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPreviousIndex(null);
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [previousIndex]);

  useEffect(() => {
    if (!isThumbnailTrayOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsThumbnailTrayOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isThumbnailTrayOpen]);

  const handleSelect = (index: number) => {
    if (index === activeIndex) {
      return;
    }
    setPreviousIndex(activeIndex);
    setActiveIndex(index);
  };

  const activeSlide = usableSlides[activeIndex] ?? null;
  const previousSlide = previousIndex !== null ? usableSlides[previousIndex] ?? null : null;
  const shouldShowThumbnailControls = usableSlides.length > 1;

  const renderSlideLayer = (slide: SlideMedia | null, state: "active" | "previous") => {
    if (!slide) {
      return null;
    }

    const layerClass = state === "active" ? "homeHeroMediaLayer isActive" : "homeHeroMediaLayer isFadingOut";

    if (slide.videoUrl) {
      return (
        <div key={`${slide.id}-${state}`} className={layerClass}>
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          >
            <source src={slide.videoUrl} />
          </video>
        </div>
      );
    }

    const desktopSrc = slide.mediaDesktop ?? slide.mediaMobile ?? "";
    const mobileSrc = slide.mediaMobile ?? slide.mediaDesktop ?? "";
    const isPriority = state === "active" && activeIndex === 0;

    return (
      <div key={`${slide.id}-${state}`} className={layerClass}>
        {desktopSrc ? (
          <Image
            src={desktopSrc}
            alt={slide.title ?? "Slide image"}
            fill
            sizes="100vw"
            priority={isPriority}
            loading={isPriority ? "eager" : "lazy"}
            unoptimized
            className="hidden h-full w-full object-cover min-[641px]:block"
          />
        ) : null}
        {mobileSrc ? (
          <Image
            src={mobileSrc}
            alt={slide.title ?? "Slide image"}
            fill
            sizes="100vw"
            priority={isPriority}
            loading={isPriority ? "eager" : "lazy"}
            unoptimized
            className="block h-full w-full object-cover min-[641px]:hidden"
          />
        ) : null}
      </div>
    );
  };

  return (
    <section className="relative bg-gray-100 text-white">
      <div className="relative flex min-h-[90svh]">
        <div className="absolute inset-0 overflow-hidden bg-white">
          {renderSlideLayer(previousSlide, "previous")}
          {renderSlideLayer(activeSlide, "active")}
          {!activeSlide ? <div className="absolute inset-0 bg-gradient-to-br from-[#efdac7] via-[#f2e5d8] to-[#efe7de]" /> : null}
        </div>

        {shouldShowThumbnailControls ? (
          <>
            <div
              className={cn(
                "homeHeroThumbnails absolute inset-x-0 bottom-0 z-[5] flex h-[60px] items-center bg-white/45 py-1.5 backdrop-blur-md transition duration-300 ease-out",
                isThumbnailTrayOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
              )}
              id="home-hero-thumbnails"
            >
              <div className="flex w-full justify-start px-1.5 md:justify-center">
                <div className="homeHeroThumbnailScrollArea flex w-max max-w-full gap-1.5 overflow-x-auto overflow-y-hidden">
                  {usableSlides.map((slide, index) => {
                    const thumbSrc =
                      slide.mediaDesktopThumb ??
                      slide.mediaMobileThumb ??
                      slide.mediaDesktop ??
                      slide.mediaMobile ??
                      "";

                    return (
                      <button
                        key={slide.id}
                        type="button"
                        className={`shrink-0 overflow-hidden transition cursor-pointer ${index === activeIndex ? "opacity-100" : "opacity-90 hover:opacity-100"}`}
                        onClick={() => handleSelect(index)}
                        aria-label={slide.title ?? `Slide ${index + 1}`}
                      >
                        {thumbSrc ? (
                          <Image
                            src={thumbSrc}
                            alt={slide.title ?? "Slide thumbnail"}
                            width={72}
                            height={48}
                            loading="lazy"
                            unoptimized
                            className="h-12 w-[4.5rem] object-cover"
                          />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="homeHeroThumbnailToggle pointer-events-auto absolute right-4 bottom-4 z-20 md:right-5">
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-white/88 px-3.5 text-sm font-semibold text-black shadow-[0_16px_40px_-24px_rgba(10,13,18,0.7)] backdrop-blur-md transition hover:bg-white cursor-pointer"
                onClick={() => setIsThumbnailTrayOpen((currentValue) => !currentValue)}
                aria-label={isThumbnailTrayOpen ? `Hide photos (${usableSlides.length})` : `Show photos (${usableSlides.length})`}
                aria-controls="home-hero-thumbnails"
                aria-expanded={isThumbnailTrayOpen}
              >
                {isThumbnailTrayOpen ? (
                  <XClose aria-hidden="true" className="h-4.5 w-4.5" />
                ) : (
                  <>
                    <Image01 aria-hidden="true" className="h-4.5 w-4.5" />
                    <span>{usableSlides.length}</span>
                  </>
                )}
              </button>
            </div>
          </>
        ) : null}

        <div className="relative z-10 flex flex-1 flex-col pointer-events-none">
          <div className="mx-auto flex min-h-full w-full max-w-[1280px] flex-col px-4 md:px-5">
            <div className="flex items-center justify-between gap-4 pointer-events-auto">
              <Image
                src="/branding/porto-santo-guide.svg"
                alt="Porto Santo Guide"
                width={120}
                height={104}
                className="h-auto w-[108px] max-[640px]:w-[88px]"
                priority
              />
              <button
                type="button"
                className="inline-flex h-[52px] w-[53px] items-center justify-center bg-[var(--psg-sand-shell)] text-black transition hover:text-black cursor-pointer max-[640px]:h-10 max-[640px]:w-10"
                onClick={() => setIsMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu02 className="h-7 w-7" aria-hidden="true" />
              </button>
            </div>

            <div className="my-auto flex max-w-[50rem] flex-col gap-6 py-12 max-[640px]:gap-5 max-[640px]:py-10 pointer-events-auto">
              <h1 className="m-0 max-w-[14ch] text-6xl font-semibold tracking-[-0.05em] text-white">
                We are the
                <br className="max-[640px]:hidden" />{" "}
                local specialists
              </h1>

              <div className="w-full">
                <GlobalSearch placeholder="What are you looking for?" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} menuLinks={menuLinks} />
    </section>
  );
}
