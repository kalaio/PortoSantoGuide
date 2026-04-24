import { prisma } from "@/lib/prisma";

export type SlideMedia = {
  id: string;
  title: string | null;
  description: string | null;
  mediaDesktop: string | null;
  mediaDesktopThumb: string | null;
  mediaMobile: string | null;
  mediaMobileThumb: string | null;
  videoUrl: string | null;
  order: number;
};

export async function getSliderBySlug(slug: string) {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  try {
    return await prisma.slider.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        slides: {
          where: { isActive: true },
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
    });
  } catch {
    return null;
  }
}
