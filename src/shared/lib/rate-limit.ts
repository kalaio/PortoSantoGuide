import { prisma } from "@/lib/prisma";

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

type RateLimitOptions = {
  scope: string;
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

async function cleanupExpiredBuckets(scope: string, cutoff: Date) {
  await prisma.rateLimitBucket.deleteMany({
    where: {
      scope,
      updatedAt: {
        lt: cutoff
      }
    }
  });
}

export async function consumeRateLimit({ scope, key, limit, windowMs }: RateLimitOptions): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  if (Math.random() < 0.05) {
    await cleanupExpiredBuckets(scope, new Date(now.getTime() - windowMs * 4));
  }

  const bucket = await prisma.rateLimitBucket.findUnique({
    where: { key }
  });

  if (!bucket || bucket.windowStart.getTime() <= windowStart.getTime()) {
    await prisma.rateLimitBucket.upsert({
      where: { key },
      create: {
        key,
        scope,
        count: 1,
        windowStart: now
      },
      update: {
        scope,
        count: 1,
        windowStart: now
      }
    });

    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    const retryAfterMs = bucket.windowStart.getTime() + windowMs - now.getTime();
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000))
    };
  }

  await prisma.rateLimitBucket.update({
    where: { key },
    data: {
      count: {
        increment: 1
      }
    }
  });

  return { allowed: true, retryAfterSeconds: 0 };
}

export async function resetRateLimit(key: string) {
  await prisma.rateLimitBucket.deleteMany({
    where: { key }
  });
}
