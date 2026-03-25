import SlidesAdminClient from "@/app/(admin)/components/SlidesAdminClient";
import { ADMIN_HEADER_ROW_CLASS, ADMIN_HERO_CLASS, ADMIN_PAGE_CLASS, ADMIN_TITLE_CLASS } from "@/app/(admin)/components/admin-tailwind";
import { requireServerUserWithRole } from "@/app/(admin)/lib/admin-auth-server";
import { prisma } from "@/lib/prisma";

type AdminSlidesPageProps = {
  searchParams?: Promise<{ sliderId?: string }>;
};

export default async function AdminSlidesPage({ searchParams }: AdminSlidesPageProps) {
  await requireServerUserWithRole(["ADMINISTRATOR"]);

  const sliders = await prisma.slider.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      createdAt: true
    }
  });

  const serializedSliders = sliders.map((slider) => ({
    ...slider,
    createdAt: slider.createdAt.toISOString()
  }));

  const resolvedSearchParams = await searchParams;
  const requestedId = resolvedSearchParams?.sliderId;
  const selectedSliderId = requestedId && sliders.some((slider) => slider.id === requestedId)
    ? requestedId
    : sliders[0]?.id ?? null;

  const selectedSlider = selectedSliderId
    ? await prisma.slider.findUnique({
        where: { id: selectedSliderId },
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          slides: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              description: true,
              mediaDesktop: true,
              mediaDesktopThumb: true,
              mediaMobile: true,
              mediaMobileThumb: true,
              videoUrl: true,
              order: true,
              isActive: true
            }
          }
        }
      })
    : null;

  return (
    <main className={ADMIN_PAGE_CLASS}>
      <section className={ADMIN_HERO_CLASS}>
        <div className={ADMIN_HEADER_ROW_CLASS}>
          <h1 className={ADMIN_TITLE_CLASS}>Slides</h1>
        </div>
        <p>Upload, reorder, and manage media for each slider.</p>
      </section>

      <SlidesAdminClient
        initialSliders={serializedSliders}
        initialSelectedId={selectedSlider?.id ?? null}
        initialSlides={selectedSlider?.slides ?? []}
      />
    </main>
  );
}
