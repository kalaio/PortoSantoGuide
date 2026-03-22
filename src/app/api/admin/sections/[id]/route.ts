import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireRequestAuthUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { requireTrustedMutationOrigin } from "@/lib/api-security";

const updateSectionSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    label: z.string().trim().min(2).max(80).optional(),
    sortOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided"
  });

const RESERVED_SECTION_SLUGS = new Set(["admin", "api"]);

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
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

  const parsed = updateSectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid section payload", issues: parsed.error.issues }, { status: 400 });
  }

  if (parsed.data.slug && RESERVED_SECTION_SLUGS.has(parsed.data.slug)) {
    return NextResponse.json(
      { error: "Invalid section payload", issues: [{ path: ["slug"], message: "This slug is reserved" }] },
      { status: 400 }
    );
  }

  const { id } = await context.params;

  try {
    const updated = await prisma.directorySection.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        slug: true,
        label: true,
        sortOrder: true,
        isActive: true
      }
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Section slug already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Could not update section" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
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

  const { id } = await context.params;

  const categoryCount = await prisma.listingCategory.count({
    where: { sectionId: id }
  });

  if (categoryCount > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete section because it still contains ${categoryCount} categor${categoryCount === 1 ? "y" : "ies"}. Move or delete ${categoryCount === 1 ? "that category" : "those categories"} first, or mark the section as inactive instead.`
      },
      { status: 409 }
    );
  }

  try {
    await prisma.directorySection.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Could not delete section" }, { status: 500 });
  }
}
