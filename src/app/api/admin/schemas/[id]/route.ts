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

const updateSchemaSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    label: z.string().trim().min(2).max(80).optional(),
    description: z.string().trim().max(240).nullable().optional(),
    sortOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
    fields: z.array(schemaFieldSchema).min(1).optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided"
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

type RouteContext = { params: Promise<{ id: string }> };

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

  const parsed = updateSchemaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid schema payload", issues: parsed.error.issues }, { status: 400 });
  }

  const { id } = await context.params;
  const normalizedFields = parsed.data.fields ? normalizeSchemaFields(parsed.data.fields) : null;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const schema = await tx.listingSchema.update({
        where: { id },
        data: {
          slug: parsed.data.slug,
          label: parsed.data.label,
          description: parsed.data.description,
          sortOrder: parsed.data.sortOrder,
          isActive: parsed.data.isActive
        },
        select: {
          id: true,
          slug: true,
          label: true,
          description: true,
          sortOrder: true,
          isActive: true
        }
      });

      if (normalizedFields) {
        await tx.listingSchemaField.deleteMany({ where: { schemaId: id } });
        await tx.listingSchemaField.createMany({
          data: normalizedFields.map((field) => ({
            schemaId: id,
            fieldKey: field.fieldKey,
            sortOrder: field.sortOrder,
            isRequired: field.isRequired,
            isFrontendFilterEnabled: field.isFrontendFilterEnabled
          }))
        });
      }

      const fields = await tx.listingSchemaField.findMany({
        where: { schemaId: id },
        orderBy: [{ sortOrder: "asc" }, { fieldKey: "asc" }],
        select: {
          fieldKey: true,
          sortOrder: true,
          isRequired: true,
          isFrontendFilterEnabled: true
        }
      });

      return { schema, fields };
    });

    return NextResponse.json({
      data: {
        ...updated.schema,
        fields: updated.fields.map((field) => ({
          ...field,
          label: getListingFieldByKey(field.fieldKey)?.label ?? field.fieldKey,
          supportsFrontendFilter: getListingFieldByKey(field.fieldKey)?.supportsFrontendFilter ?? false
        }))
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Schema not found" }, { status: 404 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Schema slug already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Could not update schema" }, { status: 500 });
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
    where: { schemaId: id }
  });

  if (categoryCount > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete schema because it is still assigned to ${categoryCount} categor${categoryCount === 1 ? "y" : "ies"}. Reassign ${categoryCount === 1 ? "that category" : "those categories"} first, or mark the schema as inactive instead.`
      },
      { status: 409 }
    );
  }

  try {
    await prisma.listingSchema.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Schema not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Could not delete schema" }, { status: 500 });
  }
}
