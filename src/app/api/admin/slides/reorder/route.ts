import { NextResponse } from "next/server";
import { z } from "zod";
import { hasRole, requireRequestAuthUser } from "@/app/(admin)/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { requireTrustedMutationOrigin } from "@/lib/api-security";

const reorderSchema = z.object({
  sliderId: z.string().trim().min(1),
  orderedIds: z.array(z.string().trim().min(1)).min(1)
});

export async function POST(request: Request) {
  const originError = requireTrustedMutationOrigin(request);
  if (originError) {
    return originError;
  }

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

  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reorder payload", issues: parsed.error.issues }, { status: 400 });
  }

  const { sliderId, orderedIds } = parsed.data;

  const slides = await prisma.slide.findMany({
    where: { id: { in: orderedIds } },
    select: { id: true, sliderId: true }
  });

  if (slides.length !== orderedIds.length) {
    return NextResponse.json({ error: "One or more slides were not found" }, { status: 404 });
  }

  if (slides.some((slide) => slide.sliderId !== sliderId)) {
    return NextResponse.json({ error: "Slides do not belong to slider" }, { status: 400 });
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.slide.update({
        where: { id },
        data: { order: index }
      })
    )
  );

  return NextResponse.json({ ok: true });
}
