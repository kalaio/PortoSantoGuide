import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireRequestAuthUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { requireTrustedMutationOrigin } from "@/lib/api-security";
import { normalizeUiIconName } from "@/lib/ui-icons";

const categoryIconSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .refine((value) => normalizeUiIconName(value) !== null, "Choose a supported icon")
  .nullable()
  .optional();

const updateCategorySchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    label: z.string().trim().min(2).max(80).optional(),
    sectionId: z.string().trim().min(1).max(64).optional(),
    schemaId: z.string().trim().min(1).max(64).optional(),
    sortOrder: z.number().int().min(0).optional(),
    iconName: categoryIconSchema,
    isActive: z.boolean().optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided"
  });

const RESERVED_CATEGORY_SLUGS = new Set(["admin", "api", "where-to-eat", "what-to-do"]);

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
    return NextResponse.json(
      { error: "Database not configured. Set DATABASE_URL in .env.local and restart dev server." },
      { status: 503 }
    );
  }

  const authUser = await requireRequestAuthUser(request);
  if (!authUser || authUser.role !== "ADMINISTRATOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const existing = await prisma.listingCategory.findUnique({
    where: { id },
    select: { id: true, schemaId: true }
  });

  if (!existing) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid category payload",
        issues: parsed.error.issues
      },
      { status: 400 }
    );
  }

  if (parsed.data.slug && RESERVED_CATEGORY_SLUGS.has(parsed.data.slug)) {
    return NextResponse.json(
      {
        error: "Invalid category payload",
        issues: [
          {
            path: ["slug"],
            message: "This slug is reserved"
          }
        ]
      },
      { status: 400 }
    );
  }

  const [section, schema] = await Promise.all([
    parsed.data.sectionId
      ? prisma.directorySection.findUnique({
          where: { id: parsed.data.sectionId },
          select: { id: true, isActive: true }
        })
      : Promise.resolve(null),
    parsed.data.schemaId
      ? prisma.listingSchema.findUnique({
          where: { id: parsed.data.schemaId },
          select: {
            id: true,
            isActive: true
          }
        })
      : Promise.resolve(null)
  ]);

  if (parsed.data.sectionId && (!section || !section.isActive)) {
    return NextResponse.json({ error: "Section not found or inactive" }, { status: 400 });
  }

  if (parsed.data.schemaId && (!schema || !schema.isActive)) {
    return NextResponse.json({ error: "Schema not found or inactive" }, { status: 400 });
  }

  try {
    const updated = await prisma.listingCategory.update({
      where: { id },
      data: {
        ...parsed.data,
        iconName:
          parsed.data.iconName === undefined
            ? undefined
            : normalizeUiIconName(parsed.data.iconName)
      },
      select: {
        id: true,
        slug: true,
        label: true,
        iconName: true,
        sectionId: true,
        schemaId: true,
        sortOrder: true,
        isActive: true,
        schema: {
          select: {
            slug: true,
            label: true,
            isActive: true
          }
        }
      }
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Category slug already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Could not update category" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const originError = requireTrustedMutationOrigin(request);
  if (originError) {
    return originError;
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      { error: "Database not configured. Set DATABASE_URL in .env.local and restart dev server." },
      { status: 503 }
    );
  }

  const authUser = await requireRequestAuthUser(request);
  if (!authUser || authUser.role !== "ADMINISTRATOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const [primaryListingCount, assignmentCount] = await Promise.all([
    prisma.listing.count({ where: { primaryCategoryId: id } }),
    prisma.listingCategoryAssignment.count({ where: { categoryId: id } })
  ]);

  if (primaryListingCount > 0 || assignmentCount > 0) {
    const usageParts: string[] = [];

    if (primaryListingCount > 0) {
      usageParts.push(
        `${primaryListingCount} primary listing${primaryListingCount === 1 ? "" : "s"}`
      );
    }

    if (assignmentCount > 0) {
      usageParts.push(
        `${assignmentCount} additional category assignment${assignmentCount === 1 ? "" : "s"}`
      );
    }

    return NextResponse.json(
      {
        error: `Cannot delete category because it is still used by ${usageParts.join(" and ")}. Remove it from those listings first, or mark the category as inactive instead.`
      },
      { status: 409 }
    );
  }

  try {
    await prisma.listingCategory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Could not delete category" }, { status: 500 });
  }
}
