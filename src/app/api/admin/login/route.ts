import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { z } from "zod";
import {
  createSessionForUser,
  getSessionCookieName,
  getSessionCookieOptions,
  isAuthConfigured
} from "@/lib/admin-auth";
import { requireTrustedMutationOrigin } from "@/lib/api-security";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, getClientIp, resetRateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1)
});

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 8;
function buildRateLimitKeys(ip: string, username?: string) {
  const keys = [`ip:${ip}`];

  if (!username) {
    return keys;
  }

  const normalizedUsername = username.trim().toLowerCase();
  if (!normalizedUsername) {
    return keys;
  }

  keys.push(`user:${normalizedUsername}`);
  keys.push(`pair:${ip}:${normalizedUsername}`);

  return keys;
}

async function enforceRateLimit(keys: string[]) {
  for (const key of keys) {
    const result = await consumeRateLimit({
      scope: "admin-login",
      key,
      limit: RATE_LIMIT_MAX_ATTEMPTS,
      windowMs: RATE_LIMIT_WINDOW_MS
    });

    if (!result.allowed) {
      return result;
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

async function clearFailures(keys: string[]) {
  await Promise.all(keys.map((key) => resetRateLimit(key)));
}

export async function POST(request: Request) {
  const originError = requireTrustedMutationOrigin(request);
  if (originError) {
    return originError;
  }

  if (!isAuthConfigured()) {
    return NextResponse.json({ error: "Admin auth is not configured" }, { status: 503 });
  }

  const ip = getClientIp(request);
  const ipRateLimitKeys = buildRateLimitKeys(ip);

  const initialRateLimit = await enforceRateLimit(ipRateLimitKeys);
  if (!initialRateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(initialRateLimit.retryAfterSeconds) } }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials payload" }, { status: 400 });
  }

  const username = parsed.data.username.trim();
  const password = parsed.data.password;
  const authRateLimitKeys = buildRateLimitKeys(ip, username);

  const authRateLimit = await enforceRateLimit(authRateLimitKeys);
  if (!authRateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(authRateLimit.retryAfterSeconds) } }
    );
  }

  const user = await prisma.user.findUnique({
    where: { username }
  });

  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const valid = await compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  await clearFailures(authRateLimitKeys);

  const token = await createSessionForUser(user);

  const response = NextResponse.json({ success: true, role: user.role });
  response.cookies.set(getSessionCookieName(), token, getSessionCookieOptions());

  return response;
}
