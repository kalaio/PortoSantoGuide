import { NextResponse } from "next/server";

const TRUSTED_ORIGIN_ENV_KEYS = [
  "APP_URL",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_BASE_URL"
] as const;

function normalizeOrigin(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function getAllowedOrigins(request: Request) {
  const requestOrigin = normalizeOrigin(request.url);
  const configuredOrigins = TRUSTED_ORIGIN_ENV_KEYS.map((key) => normalizeOrigin(process.env[key])).filter(
    (value): value is string => Boolean(value)
  );

  return new Set([requestOrigin, ...configuredOrigins].filter((value): value is string => Boolean(value)));
}

function getSourceOrigin(request: Request) {
  const origin = normalizeOrigin(request.headers.get("origin"));
  if (origin) {
    return origin;
  }

  return normalizeOrigin(request.headers.get("referer"));
}

export function requireTrustedMutationOrigin(request: Request) {
  const sourceOrigin = getSourceOrigin(request);

  if (!sourceOrigin) {
    return NextResponse.json(
      { error: "Missing origin for state-changing request" },
      { status: 403 }
    );
  }

  if (!getAllowedOrigins(request).has(sourceOrigin)) {
    return NextResponse.json(
      { error: "Cross-site state-changing requests are not allowed" },
      { status: 403 }
    );
  }

  return null;
}
