import Link from "next/link";
import HomeHero from "@/components/home/HomeHero";
import { getPublicMenuLinks } from "@/lib/listings";
import { getSliderBySlug } from "@/lib/slides";

export default async function HomePage() {
  const [slider, menuLinks] = await Promise.all([getSliderBySlug("homepage"), getPublicMenuLinks()]);
  const slides = slider?.slides ?? [];

  return (
    <main className="homePage">
      <HomeHero slides={slides} menuLinks={menuLinks} />
      <section className="page">
        <div className="publicLinkGrid">
          <Link href="/where-to-eat" className="publicLinkCard">
            <strong>Where to eat</strong>
            <p className="muted">Restaurants, pizzerias, snack-bars and more.</p>
          </Link>
          <Link href="/what-to-do" className="publicLinkCard">
            <strong>What to do</strong>
            <p className="muted">Activities, viewpoints, and local plans.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
