import { NextResponse } from "next/server";
import { z } from "zod";
import { hasRole, requireRequestAuthUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { requireTrustedMutationOrigin } from "@/lib/api-security";

const createSchema = z.object({
  title: z.string().trim().max(160).optional(),
  description: z.string().trim().max(2000).optional(),
  mediaDesktop: z.string().trim().max(512).optional(),
  mediaDesktopThumb: z.string().trim().max(512).optional(),
  mediaMobile: z.string().trim().max(512).optional(),
  mediaMobileThumb: z.string().trim().max(512).optional(),
  videoUrl: z.string().trim().max(512).optional(),
  isActive: z.boolean().optional()
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const originError = requireTrustedMutationOrigin(request);
  if (originError) {
    return originError;
  }

  const { id } = await context.params;
  const authUser = await requireRequestAuthUser(request);
  if (!hasRole(authUser, ["ADMINISTRATOR"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid slide payload", issues: parsed.error.issues }, { status: 400 });
  }

  const slider = await prisma.slider.findUnique({
    where: { id },
    select: { id: true }
  });

  if (!slider) {
    return NextResponse.json({ error: "Slider not found" }, { status: 404 });
  }

  const maxOrder = await prisma.slide.aggregate({
    where: { sliderId: slider.id },
    _max: { order: true }
  });

  const nextOrder = (maxOrder._max.order ?? -1) + 1;

  const created = await prisma.slide.create({
    data: {
      sliderId: slider.id,
      title: parsed.data.title ?? null,
      description: parsed.data.description ?? null,
      mediaDesktop: parsed.data.mediaDesktop ?? null,
      mediaDesktopThumb: parsed.data.mediaDesktopThumb ?? null,
      mediaMobile: parsed.data.mediaMobile ?? null,
      mediaMobileThumb: parsed.data.mediaMobileThumb ?? null,
      videoUrl: parsed.data.videoUrl ?? null,
      isActive: parsed.data.isActive ?? true,
      order: nextOrder
    },
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
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
