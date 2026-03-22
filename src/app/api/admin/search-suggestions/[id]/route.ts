import { NextResponse } from "next/server";
import { z } from "zod";
import { hasRole, requireRequestAuthUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { requireTrustedMutationOrigin } from "@/lib/api-security";

const updateSchema = z
  .object({
    label: z.string().trim().min(2).max(120).optional(),
    query: z.string().trim().min(1).max(120).optional(),
    priority: z.number().int().min(0).max(1000).optional(),
    isActive: z.boolean().optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required"
  });

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const originError = requireTrustedMutationOrigin(request);
  if (originError) {
    return originError;
  }

  const authUser = await requireRequestAuthUser(request);
  if (!hasRole(authUser, ["ADMINISTRATOR"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const updated = await prisma.searchSuggestion.update({
      where: { id },
      data: parsed.data
    });

    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const originError = requireTrustedMutationOrigin(request);
  if (originError) {
    return originError;
  }

  const authUser = await requireRequestAuthUser(request);
  if (!hasRole(authUser, ["ADMINISTRATOR"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    await prisma.searchSuggestion.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
  }
}
