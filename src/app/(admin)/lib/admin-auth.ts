import type { Role, User } from "@prisma/client";
import { jwtVerify, SignJWT } from "jose";
import { prisma } from "@/lib/prisma";

export type AuthUser = {
  userId: string;
  username: string;
  role: Role;
  sessionId: string;
  tokenId: string;
};

const SESSION_COOKIE = "porto_santo_guide_session";
const SESSION_AUDIENCE = "porto-santo-guide-web";
const SESSION_ISSUER = "porto-santo-guide";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

type TokenPayload = {
  userId: string;
  username: string;
  role: Role;
  tokenId: string;
};

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    return null;
  }

  return secret;
}

function getSessionKey() {
  const secret = getSessionSecret();
  return secret ? new TextEncoder().encode(secret) : null;
}

function getCookieValue(cookieHeader: string | null, key: string) {
  if (!cookieHeader) {
    return null;
  }

  const match = cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${key}=`));

  if (!match) {
    return null;
  }

  const [, value] = match.split("=");
  return value ? decodeURIComponent(value) : null;
}

function getJwtExpiryDate() {
  return new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
}

export function isAuthConfigured() {
  return Boolean(getSessionSecret());
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS
  };
}

async function signSessionToken(payload: TokenPayload) {
  const key = getSessionKey();
  if (!key) {
    throw new Error("ADMIN_SESSION_SECRET is not configured");
  }

  return new SignJWT({ role: payload.role, username: payload.username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setSubject(payload.userId)
    .setJti(payload.tokenId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(key);
}

export async function decodeSessionToken(token: string): Promise<TokenPayload | null> {
  const key = getSessionKey();
  if (!key) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, key, {
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE
    });

    const role = payload.role;
    const username = payload.username;
    const userId = payload.sub;
    const tokenId = payload.jti;

    if (
      typeof userId !== "string" ||
      typeof username !== "string" ||
      typeof tokenId !== "string" ||
      (role !== "ADMINISTRATOR" && role !== "OWNER" && role !== "SUBSCRIBER")
    ) {
      return null;
    }

    return { userId, username, role, tokenId };
  } catch {
    return null;
  }
}

export async function createSessionForUser(user: Pick<User, "id" | "username" | "role">) {
  const tokenId = crypto.randomUUID();
  const expiresAt = getJwtExpiryDate();

  await prisma.session.create({
    data: {
      tokenId,
      userId: user.id,
      expiresAt
    }
  });

  return signSessionToken({
    userId: user.id,
    username: user.username,
    role: user.role,
    tokenId
  });
}

export async function verifySessionToken(token: string): Promise<AuthUser | null> {
  const decoded = await decodeSessionToken(token);
  if (!decoded) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { tokenId: decoded.tokenId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          role: true,
          isActive: true
        }
      }
    }
  });

  if (!session) {
    return null;
  }

  if (session.revokedAt) {
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  if (!session.user.isActive) {
    return null;
  }

  return {
    userId: session.user.id,
    username: session.user.username,
    role: session.user.role,
    sessionId: session.id,
    tokenId: session.tokenId
  };
}

export async function revokeSessionToken(token: string) {
  const decoded = await decodeSessionToken(token);
  if (!decoded) {
    return;
  }

  await prisma.session.updateMany({
    where: {
      tokenId: decoded.tokenId,
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  });
}

export async function revokeAllUserSessions(userId: string) {
  await prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  });
}

export async function getRequestAuthUser(request: Request) {
  const token = getCookieValue(request.headers.get("cookie"), SESSION_COOKIE);
  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function requireRequestAuthUser(request: Request) {
  return getRequestAuthUser(request);
}

export async function revokeRequestSession(request: Request) {
  const token = getCookieValue(request.headers.get("cookie"), SESSION_COOKIE);
  if (!token) {
    return;
  }

  await revokeSessionToken(token);
}

export function hasRole(user: AuthUser | null, accepted: Role[]) {
  return Boolean(user && accepted.includes(user.role));
}

export function canManageAdmin(user: AuthUser | null) {
  return hasRole(user, ["ADMINISTRATOR", "OWNER"]);
}
