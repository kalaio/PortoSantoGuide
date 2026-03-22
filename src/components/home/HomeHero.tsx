"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import MenuIcon from "@/components/icons/material/MenuIcon";
import GlobalSearch from "@/components/search/GlobalSearch";
import MenuOverlay from "@/components/layout/MenuOverlay";
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

    const layerClass = `homeHeroMediaLayer ${state === "active" ? "isActive" : "isFadingOut"}`;

    if (slide.videoUrl) {
      return (
        <div key={`${slide.id}-${state}`} className={layerClass}>
          <video
            className="homeHeroVideo"
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
            className="homeHeroImage homeHeroImageDesktop"
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
            className="homeHeroImage homeHeroImageMobile"
          />
        ) : null}
      </div>
    );
  };

  return (
    <section className="homeHero">
      <div className="homeHeroStage">
        <div className="homeHeroMedia">
          {renderSlideLayer(previousSlide, "previous")}
          {renderSlideLayer(activeSlide, "active")}
          {!activeSlide ? <div className="homeHeroFallback" /> : null}
        </div>

        <div className="homeHeroOverlay">
          <div className="homeHeroContainer">
            <div className="homeHeroTop">
              <Image
                src="/branding/porto-santo-guide.svg"
                alt="Porto Santo Guide"
                width={120}
                height={104}
                className="homeLogo"
                priority
              />
              <button
                type="button"
                className="homeMenuButton"
                onClick={() => setIsMenuOpen(true)}
                aria-label="Open menu"
              >
                <MenuIcon aria-hidden="true" />
              </button>
            </div>

            <div className="homeHeroContent">
              <h1>
                We are the
                <br className="homeHeroBreak" />
                {" "}
                local specialists
              </h1>
              <div className="homeHeroSearch">
                <GlobalSearch placeholder="What are you looking for?" />
              </div>
            </div>
          </div>
        </div>

        <div className="homeThumbStrip">
          <div className="homeHeroContainer">
            <div className="homeThumbs">
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
                    className={`homeThumb${index === activeIndex ? " isActive" : ""}`}
                    onClick={() => handleSelect(index)}
                    aria-label={slide.title ?? `Slide ${index + 1}`}
                  >
                    {thumbSrc ? (
                      <Image
                        src={thumbSrc}
                        alt={slide.title ?? "Slide thumbnail"}
                        width={64}
                        height={42}
                        loading="lazy"
                        unoptimized
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
