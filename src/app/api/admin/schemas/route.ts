import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRequestAuthUser } from "@/app/(admin)/lib/admin-auth";
import { getListingFieldByKey, LISTING_FIELD_KEYS } from "@/lib/listing-fields";
import { prisma } from "@/lib/prisma";
import { requireTrustedMutationOrigin } from "@/lib/api-security";

const schemaFieldSchema = z.object({
  fieldKey: z.enum(LISTING_FIELD_KEYS as [string, ...string[]]),
  sortOrder: z.number().int().min(0),
  isRequired: z.boolean().optional(),
  isFrontendFilterEnabled: z.boolean().optional()
});

const createSchemaSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  label: z.string().trim().min(2).max(80),
  description: z.string().trim().max(240).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  fields: z.array(schemaFieldSchema).min(1)
});

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

function normalizeSchemaFields(fields: Array<z.infer<typeof schemaFieldSchema>>) {
  const unique = new Map<string, { fieldKey: string; sortOrder: number; isRequired: boolean; isFrontendFilterEnabled: boolean }>();

  fields.forEach((field, index) => {
    unique.set(field.fieldKey, {
      fieldKey: field.fieldKey,
      sortOrder: field.sortOrder ?? index,
      isRequired: field.isRequired ?? false,
      isFrontendFilterEnabled: field.isFrontendFilterEnabled ?? false
    });
  });

  return [...unique.values()].sort((left, right) => left.sortOrder - right.sortOrder);
}

export async function GET(request: Request) {
  if (!hasDatabaseUrl()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const authUser = await requireRequestAuthUser(request);
  if (!authUser || authUser.role !== "ADMINISTRATOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schemas = await prisma.listingSchema.findMany({
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    select: {
      id: true,
      slug: true,
      label: true,
      description: true,
      sortOrder: true,
      isActive: true,
      fields: {
        orderBy: [{ sortOrder: "asc" }, { fieldKey: "asc" }],
        select: {
          fieldKey: true,
          sortOrder: true,
          isRequired: true,
          isFrontendFilterEnabled: true
        }
      }
    }
  });

  return NextResponse.json({
    data: schemas.map((schema) => ({
      ...schema,
      fields: schema.fields.map((field) => ({
        ...field,
        label: getListingFieldByKey(field.fieldKey)?.label ?? field.fieldKey
      }))
    }))
  });
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

  const parsed = createSchemaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid schema payload", issues: parsed.error.issues }, { status: 400 });
  }

  const normalizedFields = normalizeSchemaFields(parsed.data.fields);

  try {
    const created = await prisma.listingSchema.create({
      data: {
        slug: parsed.data.slug,
        label: parsed.data.label,
        description: parsed.data.description ?? null,
        sortOrder: parsed.data.sortOrder ?? 0,
        isActive: parsed.data.isActive ?? true,
        fields: {
          create: normalizedFields
        }
      },
      select: {
        id: true,
        slug: true,
        label: true,
        description: true,
        sortOrder: true,
        isActive: true,
        fields: {
          orderBy: [{ sortOrder: "asc" }, { fieldKey: "asc" }],
          select: {
            fieldKey: true,
            sortOrder: true,
            isRequired: true,
            isFrontendFilterEnabled: true
          }
        }
      }
    });

    return NextResponse.json({
      data: {
        ...created,
        fields: created.fields.map((field) => ({
          ...field,
          label: getListingFieldByKey(field.fieldKey)?.label ?? field.fieldKey,
          supportsFrontendFilter: getListingFieldByKey(field.fieldKey)?.supportsFrontendFilter ?? false
        }))
      }
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Schema slug already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Could not create schema" }, { status: 500 });
  }
}
