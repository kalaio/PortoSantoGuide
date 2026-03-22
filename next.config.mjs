import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const SCRIPT_SRC_POLICY = IS_PRODUCTION
  ? "script-src 'self' 'unsafe-inline'"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  SCRIPT_SRC_POLICY,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "connect-src 'self' https:",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'"
].join("; ");

const SECURITY_HEADERS = [
  {
    key: "Content-Security-Policy",
    value: CONTENT_SECURITY_POLICY
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "X-Frame-Options",
    value: "DENY"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()"
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin"
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin"
  },
  ...(IS_PRODUCTION
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains"
        }
      ]
    : [])
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  experimental: {
    optimizePackageImports: ["@heroui/date-input", "@heroui/react", "@heroui/shared-icons"]
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS
      }
    ];
  }
};

export default nextConfig;
