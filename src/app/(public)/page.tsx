import Link from "next/link";
import HomeHero from "@/components/home/HomeHero";
import { getPublicMenuLinks } from "@/lib/listings";
import { getSliderBySlug } from "@/lib/slides";

export default async function HomePage() {
  const [slider, menuLinks] = await Promise.all([getSliderBySlug("homepage"), getPublicMenuLinks()]);
  const slides = slider?.slides ?? [];

  return (
    <main className="bg-gray-warm-100">
      <HomeHero slides={slides} menuLinks={menuLinks} />
      <section className="mx-auto w-full max-w-[1280px] px-5 py-8 max-[640px]:px-3 max-[640px]:py-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/where-to-eat"
            className="grid gap-2 rounded-[1.75rem] border border-gray-warm-200 bg-white px-6 py-7 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200"
          >
            <strong className="text-[1.75rem] font-semibold text-gray-950 max-[640px]:text-[1.4rem]">Where to eat</strong>
            <p className="text-lg text-gray-500 max-[640px]:text-base">Restaurants, pizzerias, bars, bakeries and more.</p>
          </Link>

          <Link
            href="/what-to-do"
            className="grid gap-2 rounded-[1.75rem] border border-gray-warm-200 bg-white px-6 py-7 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200"
          >
            <strong className="text-[1.75rem] font-semibold text-gray-950 max-[640px]:text-[1.4rem]">What to do</strong>
            <p className="text-lg text-gray-500 max-[640px]:text-base">Activities, viewpoints, and local plans.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
