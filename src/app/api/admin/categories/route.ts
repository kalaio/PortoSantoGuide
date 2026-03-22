import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireRequestAuthUser } from "@/lib/admin-auth";
import {
  MATERIAL_SYMBOL_ICON_NAME_PATTERN,
  normalizeMaterialSymbolIconName
} from "@/lib/material-symbols";
import { prisma } from "@/lib/prisma";
import { requireTrustedMutationOrigin } from "@/lib/api-security";

const categoryIconSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(MATERIAL_SYMBOL_ICON_NAME_PATTERN, "Use lowercase letters, numbers, and underscores")
  .nullable()
  .optional();

const createCategorySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  label: z.string().trim().min(2).max(80),
  sectionId: z.string().trim().min(1).max(64),
  schemaId: z.string().trim().min(1).max(64),
  sortOrder: z.number().int().min(0).optional(),
  iconName: categoryIconSchema,
  isActive: z.boolean().optional()
});

const RESERVED_CATEGORY_SLUGS = new Set(["admin", "api", "where-to-eat", "what-to-do"]);

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export async function GET(request: Request) {
  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      { error: "Database not configured. Set DATABASE_URL in .env.local and restart dev server." },
      { status: 503 }
    );
  }

  const authUser = await requireRequestAuthUser(request);
  if (!authUser || authUser.role === "SUBSCRIBER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await prisma.listingCategory.findMany({
    orderBy: [
      {
        section: {
          sortOrder: "asc"
        }
      },
      { sortOrder: "asc" },
      { label: "asc" }
    ],
    select: {
      id: true,
      slug: true,
      label: true,
      iconName: true,
      isActive: true,
      sortOrder: true,
      sectionId: true,
      schemaId: true,
      section: {
        select: {
          slug: true,
          label: true,
          isActive: true
        }
      },
      schema: {
        select: {
          slug: true,
          label: true,
          isActive: true
        }
      }
    }
    });

  const sections = await prisma.directorySection.findMany({
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    select: {
      id: true,
      slug: true,
      label: true,
      isActive: true,
      sortOrder: true
    }
  });

  const schemas = await prisma.listingSchema.findMany({
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    select: {
      id: true,
      slug: true,
      label: true,
      isActive: true
    }
  });

  return NextResponse.json({ data: categories, sections, schemas });
}

export async function POST(request: Request) {
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

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid category payload",
        issues: parsed.error.issues
      },
      { status: 400 }
    );
  }

  if (RESERVED_CATEGORY_SLUGS.has(parsed.data.slug)) {
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
    prisma.directorySection.findUnique({
      where: {
        id: parsed.data.sectionId
      },
      select: {
        id: true,
        isActive: true
      }
    }),
    prisma.listingSchema.findUnique({
      where: { id: parsed.data.schemaId },
      select: {
        id: true,
        isActive: true
      }
    })
  ]);

  if (!section || !section.isActive) {
    return NextResponse.json({ error: "Section not found or inactive" }, { status: 400 });
  }

  if (!schema || !schema.isActive) {
    return NextResponse.json({ error: "Schema not found or inactive" }, { status: 400 });
  }

  try {
    const created = await prisma.listingCategory.create({
      data: {
        slug: parsed.data.slug,
        label: parsed.data.label,
        iconName: normalizeMaterialSymbolIconName(parsed.data.iconName),
        sectionId: parsed.data.sectionId,
        schemaId: parsed.data.schemaId,
        sortOrder: parsed.data.sortOrder ?? 0,
        isActive: parsed.data.isActive ?? true
      },
      select: {
        id: true,
        slug: true,
        label: true,
        iconName: true,
        isActive: true,
        sortOrder: true,
        sectionId: true,
        schemaId: true,
        section: {
          select: {
            slug: true,
            label: true,
            isActive: true
          }
        },
        schema: {
          select: {
            slug: true,
            label: true,
            isActive: true
          }
        }
      }
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Category slug already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Could not create category" }, { status: 500 });
  }
}
