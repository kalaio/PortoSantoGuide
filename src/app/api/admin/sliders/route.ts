import { NextResponse } from "next/server";
import { z } from "zod";
import { hasRole, requireRequestAuthUser } from "@/app/(admin)/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { requireTrustedMutationOrigin } from "@/lib/api-security";

const sliderSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(80)
});

export async function GET(request: Request) {
  const authUser = await requireRequestAuthUser(request);
  if (!hasRole(authUser, ["ADMINISTRATOR"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sliders = await prisma.slider.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      createdAt: true,
      _count: { select: { slides: true } }
    }
  });

  return NextResponse.json({ data: sliders });
}

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

  const parsed = sliderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid slider payload", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const created = await prisma.slider.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true
      }
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create slider" }, { status: 500 });
  }
}
