import { NextResponse } from "next/server";
import { z } from "zod";
import { hasRole, requireRequestAuthUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { requireTrustedMutationOrigin } from "@/lib/api-security";

const createSchema = z.object({
  label: z.string().trim().min(2).max(120),
  query: z.string().trim().min(1).max(120),
  priority: z.number().int().min(0).max(1000).default(0),
  isActive: z.boolean().default(true)
});

export async function GET(request: Request) {
  const authUser = await requireRequestAuthUser(request);
  if (!hasRole(authUser, ["ADMINISTRATOR"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const suggestions = await prisma.searchSuggestion.findMany({
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }]
  });

  return NextResponse.json({ data: suggestions, count: suggestions.length });
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

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const created = await prisma.searchSuggestion.create({
    data: parsed.data
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
