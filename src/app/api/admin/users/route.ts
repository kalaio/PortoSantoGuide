import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { hasRole, requireRequestAuthUser } from "@/app/(admin)/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { requireTrustedMutationOrigin } from "@/lib/api-security";

const createUserSchema = z.object({
  username: z.string().trim().min(3).max(40),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["ADMINISTRATOR", "OWNER", "SUBSCRIBER"])
});

export async function GET(request: Request) {
  const authUser = await requireRequestAuthUser(request);
  if (!hasRole(authUser, ["ADMINISTRATOR"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true
    },
    orderBy: [{ role: "asc" }, { createdAt: "desc" }]
  });

  return NextResponse.json({ data: users, count: users.length });
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

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid user payload", issues: parsed.error.issues }, { status: 400 });
  }

  const passwordHash = await hash(parsed.data.password, 10);

  try {
    const created = await prisma.user.create({
      data: {
        username: parsed.data.username,
        email: parsed.data.email,
        role: parsed.data.role,
        passwordHash,
        isActive: true
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Could not create user" }, { status: 500 });
  }
}
