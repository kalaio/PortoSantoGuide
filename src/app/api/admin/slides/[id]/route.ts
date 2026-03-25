import { NextResponse } from "next/server";
import { z } from "zod";
import { hasRole, requireRequestAuthUser } from "@/app/(admin)/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { requireTrustedMutationOrigin } from "@/lib/api-security";

const updateSchema = z
  .object({
    title: z.string().trim().max(160).nullable().optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    mediaDesktop: z.string().trim().max(512).nullable().optional(),
    mediaDesktopThumb: z.string().trim().max(512).nullable().optional(),
    mediaMobile: z.string().trim().max(512).nullable().optional(),
    mediaMobileThumb: z.string().trim().max(512).nullable().optional(),
    videoUrl: z.string().trim().max(512).nullable().optional(),
    order: z.number().int().min(0).optional(),
    isActive: z.boolean().optional()
  })
  .refine((data) => Object.keys(data).length > 0, { message: "No fields provided" });

function normalizeOptionalString(value: string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const originError = requireTrustedMutationOrigin(request);
  if (originError) {
    return originError;
  }

  const { id } = await context.params;
  const authUser = await requireRequestAuthUser(request);
  if (!hasRole(authUser, ["ADMINISTRATOR"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid slide payload", issues: parsed.error.issues }, { status: 400 });
  }

  const existing = await prisma.slide.findUnique({
    where: { id },
    select: { id: true }
  });
  if (!existing) {
    return NextResponse.json({ error: "Slide not found" }, { status: 404 });
  }

  const data = {
    title: normalizeOptionalString(parsed.data.title),
    description: normalizeOptionalString(parsed.data.description),
    mediaDesktop: normalizeOptionalString(parsed.data.mediaDesktop),
    mediaDesktopThumb: normalizeOptionalString(parsed.data.mediaDesktopThumb),
    mediaMobile: normalizeOptionalString(parsed.data.mediaMobile),
    mediaMobileThumb: normalizeOptionalString(parsed.data.mediaMobileThumb),
    videoUrl: normalizeOptionalString(parsed.data.videoUrl),
    order: parsed.data.order,
    isActive: parsed.data.isActive
  };

  const updated = await prisma.slide.update({
    where: { id },
    data,
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

  return NextResponse.json({ data: updated });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const originError = requireTrustedMutationOrigin(request);
  if (originError) {
    return originError;
  }

  const { id } = await context.params;
  const authUser = await requireRequestAuthUser(request);
  if (!hasRole(authUser, ["ADMINISTRATOR"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.slide.findUnique({
    where: { id },
    select: { id: true }
  });
  if (!existing) {
    return NextResponse.json({ error: "Slide not found" }, { status: 404 });
  }

  await prisma.slide.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
