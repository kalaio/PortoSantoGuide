import Link from "next/link";
import HomeHero from "@/app/(frontend)/components/HomeHero";
import { getPublicMenuLinks } from "@/lib/listings";
import { getSliderBySlug } from "@/lib/slides";

export default async function HomePage() {
  const [slider, menuLinks] = await Promise.all([getSliderBySlug("homepage"), getPublicMenuLinks()]);
  const slides = slider?.slides ?? [];

  return (
    <main className="bg-gray-100">
      <HomeHero slides={slides} menuLinks={menuLinks} />
      <section className="mx-auto w-full max-w-[1280px] px-4 py-4 md:px-5 md:py-8">
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/where-to-eat"
            className="grid gap-2 rounded-[1.75rem] border border-black/10 bg-white px-6 py-7 transition hover:-translate-y-0.5 hover:border-[color:rgb(7_109_112_/_0.28)]"
          >
            <strong className="text-xl font-semibold text-black">Where to eat</strong>
            <p className="text-md text-[color:var(--psg-text-secondary)]">Restaurants, pizzerias, bars, bakeries and more.</p>
          </Link>

          <Link
            href="/what-to-do"
            className="grid gap-2 rounded-[1.75rem] border border-black/10 bg-white px-6 py-7 transition hover:-translate-y-0.5 hover:border-[color:rgb(7_109_112_/_0.28)]"
          >
            <strong className="text-xl font-semibold text-black">What to do</strong>
            <p className="text-md text-[color:var(--psg-text-secondary)]">Activities, viewpoints, and local plans.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
