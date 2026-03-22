import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { hasRole, requireRequestAuthUser, revokeAllUserSessions } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { requireTrustedMutationOrigin } from "@/lib/api-security";

const PROTECTED_ADMIN_USERNAME = "administrator";

const updateUserSchema = z
  .object({
    username: z.string().trim().min(3).max(40).optional(),
    email: z.string().trim().toLowerCase().email().optional(),
    password: z.string().min(8).max(128).optional(),
    role: z.enum(["ADMINISTRATOR", "OWNER", "SUBSCRIBER"]).optional(),
    isActive: z.boolean().optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field must be provided"
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

  const targetUser = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      role: true,
      isActive: true
    }
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid user payload", issues: parsed.error.issues }, { status: 400 });
  }

  if (!authUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (id === authUser.userId && parsed.data.isActive === false) {
    return NextResponse.json({ error: "You cannot deactivate your own account" }, { status: 400 });
  }

  if (targetUser.username === PROTECTED_ADMIN_USERNAME) {
    if (parsed.data.username && parsed.data.username !== PROTECTED_ADMIN_USERNAME) {
      return NextResponse.json(
        { error: "The default administrator username cannot be changed." },
        { status: 400 }
      );
    }

    if (parsed.data.role && parsed.data.role !== "ADMINISTRATOR") {
      return NextResponse.json(
        { error: "The default administrator role cannot be changed." },
        { status: 400 }
      );
    }

    if (parsed.data.isActive === false) {
      return NextResponse.json(
        { error: "The default administrator account cannot be deactivated." },
        { status: 400 }
      );
    }
  }

  const normalizedUsername = parsed.data.username?.trim();
  const normalizedEmail = parsed.data.email?.trim().toLowerCase();

  if (normalizedUsername || normalizedEmail) {
    const conflictingUser = await prisma.user.findFirst({
      where: {
        id: {
          not: id
        },
        OR: [
          ...(normalizedUsername ? [{ username: normalizedUsername }] : []),
          ...(normalizedEmail ? [{ email: normalizedEmail }] : [])
        ]
      },
      select: {
        username: true,
        email: true
      }
    });

    if (conflictingUser) {
      if (normalizedUsername && conflictingUser.username === normalizedUsername) {
        return NextResponse.json(
          {
            error: "Username already exists",
            issues: [{ path: ["username"], message: "Username already exists." }]
          },
          { status: 409 }
        );
      }

      if (normalizedEmail && conflictingUser.email === normalizedEmail) {
        return NextResponse.json(
          {
            error: "Email already exists",
            issues: [{ path: ["email"], message: "Email already exists." }]
          },
          { status: 409 }
        );
      }
    }
  }

  const data: Prisma.UserUpdateInput = {
    username: normalizedUsername,
    email: normalizedEmail,
    role: parsed.data.role,
    isActive: parsed.data.isActive
  };

  if (parsed.data.password) {
    data.passwordHash = await hash(parsed.data.password, 10);
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    if (parsed.data.password || parsed.data.isActive === false || parsed.data.role) {
      await revokeAllUserSessions(id);
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Could not update user" }, { status: 500 });
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

  if (!authUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  const targetUser = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true
    }
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (id === authUser.userId) {
    return NextResponse.json(
      {
        error: "Cannot delete your own account while you are signed in. Use another administrator account if you need to remove this user."
      },
      { status: 400 }
    );
  }

  if (targetUser.username === PROTECTED_ADMIN_USERNAME) {
    return NextResponse.json(
      { error: "The default administrator account cannot be deleted." },
      { status: 400 }
    );
  }

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Could not delete user" }, { status: 500 });
  }
}
