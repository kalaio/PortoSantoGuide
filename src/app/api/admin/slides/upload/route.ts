import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import sharp from "sharp";
import { hasRole, requireRequestAuthUser } from "@/lib/admin-auth";
import { requireTrustedMutationOrigin } from "@/lib/api-security";

export const runtime = "nodejs";

async function ensureUploadsDir() {
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "slides");
  await fs.mkdir(uploadsDir, { recursive: true });
  return uploadsDir;
}

const MIME_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif"
};

const ALLOWED_IMAGE_MIME_TYPES = new Set(Object.keys(MIME_EXTENSION_MAP));
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const THUMBNAIL_WIDTH = 320;

type ThumbnailOptions = sharp.JpegOptions | sharp.PngOptions | sharp.WebpOptions | sharp.AvifOptions;

const THUMBNAIL_FORMATS: Record<
  string,
  { format: "jpeg" | "png" | "webp" | "avif"; options?: ThumbnailOptions }
> = {
  jpg: { format: "jpeg", options: { quality: 70 } },
  jpeg: { format: "jpeg", options: { quality: 70 } },
  png: { format: "png" },
  webp: { format: "webp", options: { quality: 70 } },
  avif: { format: "avif", options: { quality: 55 } }
};

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

  const authUser = await requireRequestAuthUser(request);
  if (!hasRole(authUser, ["ADMINISTRATOR"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
    return NextResponse.json(
      {
        error: "Unsupported image type. Allowed formats: JPEG, PNG, WEBP, AVIF."
      },
      { status: 415 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = MIME_EXTENSION_MAP[mimeType] ?? "img";

  const uploadsDir = await ensureUploadsDir();
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
    thumbPath = `/uploads/slides/${thumbFilename}`;
  }

  return NextResponse.json({ path: `/uploads/slides/${filename}`, thumbPath }, { status: 201 });
}
