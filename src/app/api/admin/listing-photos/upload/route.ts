import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { requireRequestAuthUser } from "@/app/(admin)/lib/admin-auth";
import { requireTrustedMutationOrigin } from "@/lib/api-security";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const UPLOAD_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const UPLOAD_RATE_LIMIT_MAX_ATTEMPTS = 30;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const THUMBNAIL_WIDTH = 480;

const MIME_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif"
};

const THUMBNAIL_FORMATS: Record<
  string,
  { format: "jpeg" | "png" | "webp" | "avif"; options?: sharp.JpegOptions | sharp.PngOptions | sharp.WebpOptions | sharp.AvifOptions }
> = {
  jpg: { format: "jpeg", options: { quality: 72 } },
  jpeg: { format: "jpeg", options: { quality: 72 } },
  png: { format: "png" },
  webp: { format: "webp", options: { quality: 72 } },
  avif: { format: "avif", options: { quality: 55 } }
};

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

async function ensureUploadsDir() {
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "listings");
  await fs.mkdir(uploadsDir, { recursive: true });
  return uploadsDir;
}

async function createThumbnail(buffer: Buffer, extension: string) {
  const formatConfig = THUMBNAIL_FORMATS[extension];
  if (!formatConfig) {
    return null;
  }

  try {
    return await sharp(buffer)
      .rotate()
      .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
      .toFormat(formatConfig.format, formatConfig.options)
      .toBuffer();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const originError = requireTrustedMutationOrigin(request);
  if (originError) {
    return originError;
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const authUser = await requireRequestAuthUser(request);
  if (!authUser || authUser.role === "SUBSCRIBER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rateLimitResult = await consumeRateLimit({
    scope: "admin-listing-photo-upload",
    key: `listing-photo-upload:${ip}`,
    limit: UPLOAD_RATE_LIMIT_MAX_ATTEMPTS,
    windowMs: UPLOAD_RATE_LIMIT_WINDOW_MS
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Upload rate limit exceeded. Try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimitResult.retryAfterSeconds) } }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  if (file.size <= 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `File is too large. Maximum allowed size is ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))}MB.` },
      { status: 413 }
    );
  }

  const mimeType = file.type.toLowerCase();
  const extension = MIME_EXTENSION_MAP[mimeType];

  if (!extension) {
    return NextResponse.json(
      { error: "Unsupported image type. Allowed formats: JPEG, PNG, WEBP, AVIF." },
      { status: 415 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadsDir = await ensureUploadsDir();
  const metadata = await sharp(buffer).metadata();
  const baseId = crypto.randomUUID();
  const filename = `${baseId}.${extension}`;
  const filepath = path.join(uploadsDir, filename);

  await fs.writeFile(filepath, buffer);

  const thumbnailBuffer = await createThumbnail(buffer, extension);
  let thumbPath: string | null = null;
  if (thumbnailBuffer) {
    const thumbFilename = `${baseId}-thumb.${extension}`;
    const thumbFilepath = path.join(uploadsDir, thumbFilename);
    await fs.writeFile(thumbFilepath, thumbnailBuffer);
    thumbPath = `/uploads/listings/${thumbFilename}`;
  }

  const asset = await prisma.photoAsset.create({
    data: {
      originalPath: `/uploads/listings/${filename}`,
      thumbnailPath: thumbPath,
      mimeType,
      byteSize: file.size,
      width: metadata.width ?? null,
      height: metadata.height ?? null
    },
    select: {
      id: true,
      originalPath: true,
      thumbnailPath: true,
      width: true,
      height: true
    }
  });

  return NextResponse.json(
    {
      assetId: asset.id,
      path: asset.originalPath,
      thumbPath: asset.thumbnailPath,
      width: asset.width,
      height: asset.height
    },
    { status: 201 }
  );
}
