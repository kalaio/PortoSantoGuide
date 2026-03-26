"use client";

import { Menu02 } from "@untitledui/icons";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
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

  const handleSelect = (index: number) => {
    if (index === activeIndex) {
      return;
    }
    setPreviousIndex(activeIndex);
    setActiveIndex(index);
  };

  const activeSlide = usableSlides[activeIndex] ?? null;
  const previousSlide = previousIndex !== null ? usableSlides[previousIndex] ?? null : null;

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
      <div className="relative flex min-h-[95svh] overflow-hidden">
        <div className="absolute inset-0 overflow-hidden bg-white">
          {renderSlideLayer(previousSlide, "previous")}
          {renderSlideLayer(activeSlide, "active")}
          {!activeSlide ? <div className="absolute inset-0 bg-gradient-to-br from-[#efdac7] via-[#f2e5d8] to-[#efe7de]" /> : null}
        </div>

        <div className="relative flex flex-1 flex-col pb-[60px]">
          <div className="mx-auto flex min-h-full w-full max-w-[1280px] flex-col px-4 md:px-5">
            <div className="flex items-center justify-between gap-4">
              <Image
                src="/branding/porto-santo-guide.svg"
                alt="Porto Santo Guide"
                width={120}
                height={104}
                className="h-auto w-[120px] max-[640px]:w-[112px]"
                priority
              />
              <button
                type="button"
                className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/90 text-gray-700 backdrop-blur-sm transition hover:bg-white max-[640px]:h-12 max-[640px]:w-12"
                onClick={() => setIsMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu02 className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <div className="my-auto flex max-w-[50rem] flex-col gap-6 py-12 max-[640px]:gap-5 max-[640px]:py-10">
              <h1 className="m-0 max-w-[14ch] text-[clamp(2rem,5vw,4rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-white drop-shadow-[0_10px_35px_rgba(16,24,40,0.2)]">
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

        <div className="homeHeroThumbnails absolute inset-x-0 bottom-0 z-10 flex h-[60px] items-center bg-white/45 py-1.5">
          <div className="mx-auto flex max-w-[1280px] justify-center px-2">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
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
                    className={`shrink-0 overflow-hidden transition ${index === activeIndex ? "opacity-100" : "opacity-90 hover:opacity-100"}`}
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
      </div>

      <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} menuLinks={menuLinks} />
    </section>
  );
}
