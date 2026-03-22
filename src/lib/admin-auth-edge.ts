import type { Role } from "@prisma/client";
import { jwtVerify } from "jose";

type EdgeAuthPayload = {
  userId: string;
  username: string;
  role: Role;
  tokenId: string;
};

const SESSION_COOKIE = "porto_santo_guide_session";
const SESSION_AUDIENCE = "porto-santo-guide-web";
const SESSION_ISSUER = "porto-santo-guide";

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

export function isAuthConfiguredEdge() {
  return Boolean(getSessionSecret());
}

export function getSessionCookieNameEdge() {
  return SESSION_COOKIE;
}

export async function decodeSessionTokenEdge(token: string): Promise<EdgeAuthPayload | null> {
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
