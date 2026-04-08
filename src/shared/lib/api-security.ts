import { NextResponse } from "next/server";

const TRUSTED_ORIGIN_ENV_KEYS = [
  "ALLOWED_ORIGINS",
  "TRUSTED_ORIGINS",
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

function parseOriginList(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => normalizeOrigin(entry.trim()))
    .filter((entry): entry is string => Boolean(entry));
}

function getHeaderValue(request: Request, headerName: string) {
  const value = request.headers.get(headerName);
  if (!value) {
    return null;
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .find(Boolean) ?? null;
}

function getRequestHostOrigin(request: Request) {
  const host = getHeaderValue(request, "x-forwarded-host") ?? getHeaderValue(request, "host");
  if (!host) {
    return null;
  }

  const requestProtocol = (() => {
    try {
      return new URL(request.url).protocol.replace(":", "");
    } catch {
      return null;
    }
  })();

  const protocol = getHeaderValue(request, "x-forwarded-proto") ?? requestProtocol ?? "http";

  return normalizeOrigin(`${protocol}://${host}`);
}

function getAllowedOrigins(request: Request) {
  const requestOrigin = normalizeOrigin(request.url);
  const requestHostOrigin = getRequestHostOrigin(request);
  const configuredOrigins = TRUSTED_ORIGIN_ENV_KEYS.flatMap((key) => parseOriginList(process.env[key]));

  return new Set(
    [requestOrigin, requestHostOrigin, ...configuredOrigins].filter((value): value is string => Boolean(value))
  );
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
