import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireRequestAuthUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { requireTrustedMutationOrigin } from "@/lib/api-security";

const sectionSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  label: z.string().trim().min(2).max(80),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional()
});

const RESERVED_SECTION_SLUGS = new Set(["admin", "api"]);

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export async function GET(request: Request) {
  if (!hasDatabaseUrl()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const authUser = await requireRequestAuthUser(request);
  if (!authUser || authUser.role !== "ADMINISTRATOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sections = await prisma.directorySection.findMany({
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    select: {
      id: true,
      slug: true,
      label: true,
      sortOrder: true,
      isActive: true
    }
  });

  return NextResponse.json({ data: sections });
}

export async function POST(request: Request) {
  const originError = requireTrustedMutationOrigin(request);
  if (originError) {
    return originError;
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const authUser = await requireRequestAuthUser(request);
  if (!authUser || authUser.role !== "ADMINISTRATOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = sectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid section payload", issues: parsed.error.issues }, { status: 400 });
  }

  if (RESERVED_SECTION_SLUGS.has(parsed.data.slug)) {
    return NextResponse.json(
      { error: "Invalid section payload", issues: [{ path: ["slug"], message: "This slug is reserved" }] },
      { status: 400 }
    );
  }

  try {
    const created = await prisma.directorySection.create({
      data: {
        slug: parsed.data.slug,
        label: parsed.data.label,
        sortOrder: parsed.data.sortOrder ?? 0,
        isActive: parsed.data.isActive ?? true
      },
      select: {
        id: true,
        slug: true,
        label: true,
        sortOrder: true,
        isActive: true
      }
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Section slug already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Could not create section" }, { status: 500 });
  }
}
