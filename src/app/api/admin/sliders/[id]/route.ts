import { NextResponse } from "next/server";
import { z } from "zod";
import { hasRole, requireRequestAuthUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { requireTrustedMutationOrigin } from "@/lib/api-security";

const updateSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    slug: z.string().trim().min(2).max(80).optional(),
    isActive: z.boolean().optional()
  })
  .refine((data) => Object.keys(data).length > 0, { message: "No fields provided" });

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const authUser = await requireRequestAuthUser(request);
  if (!hasRole(authUser, ["ADMINISTRATOR"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const slider = await prisma.slider.findUnique({
    where: { id },
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
  });

  if (!slider) {
    return NextResponse.json({ error: "Slider not found" }, { status: 404 });
  }

  return NextResponse.json({ data: slider });
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
    return NextResponse.json({ error: "Invalid slider payload", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const updated = await prisma.slider.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true
      }
    });

    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: "Could not update slider" }, { status: 500 });
  }
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

  try {
    await prisma.slider.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete slider" }, { status: 500 });
  }
}
