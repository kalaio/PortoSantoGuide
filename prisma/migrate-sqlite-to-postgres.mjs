import path from "path";
import { existsSync } from "fs";
import { DatabaseSync } from "node:sqlite";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_SQLITE_SOURCE_PATH = path.join(process.cwd(), "prisma", "porto-santo-guide.db");
const SQLITE_SOURCE_PATH = path.resolve(process.cwd(), process.env.SQLITE_SOURCE_PATH ?? DEFAULT_SQLITE_SOURCE_PATH);

function readTable(db, tableName) {
  return db.prepare(`SELECT * FROM "${tableName}"`).all();
}

function toBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  return Boolean(value);
}

function toDate(value) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
}

function toJson(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "string") {
    return JSON.parse(value);
  }

  return value;
}

async function ensureDestinationIsEmpty() {
  const [userCount, sectionCount, schemaCount, listingCount, revisionCount, sliderCount] = await Promise.all([
    prisma.user.count(),
    prisma.directorySection.count(),
    prisma.listingSchema.count(),
    prisma.listing.count(),
    prisma.listingRevision.count(),
    prisma.slider.count()
  ]);

  const total = userCount + sectionCount + schemaCount + listingCount + revisionCount + sliderCount;
  if (total > 0) {
    throw new Error("Destination PostgreSQL database is not empty. Start from a clean schema before importing SQLite data.");
  }
}

async function createManyInChunks(delegate, data, chunkSize = 100) {
  for (let index = 0; index < data.length; index += chunkSize) {
    await delegate.createMany({
      data: data.slice(index, index + chunkSize)
    });
  }
}

async function main() {
  if (!existsSync(SQLITE_SOURCE_PATH)) {
    throw new Error(`SQLite source file not found at ${SQLITE_SOURCE_PATH}`);
  }

  await ensureDestinationIsEmpty();

  const sqlite = new DatabaseSync(SQLITE_SOURCE_PATH, { open: true, readOnly: true });

  try {
    const users = readTable(sqlite, "User");
    const sections = readTable(sqlite, "DirectorySection");
    const schemas = readTable(sqlite, "ListingSchema");
    const schemaFields = readTable(sqlite, "ListingSchemaField");
    const schemaPhotoSections = readTable(sqlite, "ListingSchemaPhotoSection");
    const categories = readTable(sqlite, "ListingCategory");
    const suggestions = readTable(sqlite, "SearchSuggestion");
    const sliders = readTable(sqlite, "Slider");
    const slides = readTable(sqlite, "Slide");
    const photoAssets = readTable(sqlite, "PhotoAsset");
    const listings = readTable(sqlite, "Listing");
    const listingAssignments = readTable(sqlite, "ListingCategoryAssignment");
    const revisions = readTable(sqlite, "ListingRevision");
    const revisionAssignments = readTable(sqlite, "ListingRevisionCategoryAssignment");
    const revisionPhotos = readTable(sqlite, "ListingRevisionPhoto");

    await createManyInChunks(prisma.user, users.map((row) => ({
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.passwordHash,
      role: row.role,
      isActive: toBoolean(row.isActive),
      createdAt: toDate(row.createdAt),
      updatedAt: toDate(row.updatedAt)
    })));

    await createManyInChunks(prisma.directorySection, sections.map((row) => ({
      id: row.id,
      slug: row.slug,
      label: row.label,
      sortOrder: row.sortOrder,
      isActive: toBoolean(row.isActive),
      createdAt: toDate(row.createdAt),
      updatedAt: toDate(row.updatedAt)
    })));

    await createManyInChunks(prisma.listingSchema, schemas.map((row) => ({
      id: row.id,
      slug: row.slug,
      label: row.label,
      description: row.description,
      sortOrder: row.sortOrder,
      isActive: toBoolean(row.isActive),
      createdAt: toDate(row.createdAt),
      updatedAt: toDate(row.updatedAt)
    })));

    await createManyInChunks(prisma.listingSchemaField, schemaFields.map((row) => ({
      schemaId: row.schemaId,
      fieldKey: row.fieldKey,
      sortOrder: row.sortOrder,
      isRequired: toBoolean(row.isRequired),
      isFrontendFilterEnabled: toBoolean(row.isFrontendFilterEnabled)
    })));

    await createManyInChunks(prisma.listingSchemaPhotoSection, schemaPhotoSections.map((row) => ({
      id: row.id,
      schemaId: row.schemaId,
      slug: row.slug,
      label: row.label,
      sortOrder: row.sortOrder,
      isActive: toBoolean(row.isActive),
      createdAt: toDate(row.createdAt),
      updatedAt: toDate(row.updatedAt)
    })));

    await createManyInChunks(prisma.listingCategory, categories.map((row) => ({
      id: row.id,
      slug: row.slug,
      label: row.label,
      iconName: row.iconName,
      sectionId: row.sectionId,
      schemaId: row.schemaId,
      sortOrder: row.sortOrder,
      isActive: toBoolean(row.isActive),
      createdAt: toDate(row.createdAt),
      updatedAt: toDate(row.updatedAt)
    })));

    await createManyInChunks(prisma.searchSuggestion, suggestions.map((row) => ({
      id: row.id,
      label: row.label,
      query: row.query,
      priority: row.priority,
      isActive: toBoolean(row.isActive),
      createdAt: toDate(row.createdAt),
      updatedAt: toDate(row.updatedAt)
    })));

    await createManyInChunks(prisma.slider, sliders.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      isActive: toBoolean(row.isActive),
      createdAt: toDate(row.createdAt),
      updatedAt: toDate(row.updatedAt)
    })));

    await createManyInChunks(prisma.slide, slides.map((row) => ({
      id: row.id,
      sliderId: row.sliderId,
      title: row.title,
      description: row.description,
      mediaDesktop: row.mediaDesktop,
      mediaDesktopThumb: row.mediaDesktopThumb,
      mediaMobile: row.mediaMobile,
      mediaMobileThumb: row.mediaMobileThumb,
      videoUrl: row.videoUrl,
      order: row.order,
      isActive: toBoolean(row.isActive),
      createdAt: toDate(row.createdAt),
      updatedAt: toDate(row.updatedAt)
    })));

    await createManyInChunks(prisma.photoAsset, photoAssets.map((row) => ({
      id: row.id,
      originalPath: row.originalPath,
      thumbnailPath: row.thumbnailPath,
      mimeType: row.mimeType,
      byteSize: row.byteSize,
      width: row.width,
      height: row.height,
      createdAt: toDate(row.createdAt),
      updatedAt: toDate(row.updatedAt)
    })));

    await createManyInChunks(prisma.listing, listings.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      status: row.status,
      latitude: row.latitude,
      longitude: row.longitude,
      rating: row.rating,
      details: toJson(row.details),
      primaryCategoryId: row.primaryCategoryId,
      currentPublishedRevisionId: null,
      currentDraftRevisionId: null,
      ownerId: row.ownerId,
      createdAt: toDate(row.createdAt),
      updatedAt: toDate(row.updatedAt)
    })));

    await createManyInChunks(prisma.listingCategoryAssignment, listingAssignments.map((row) => ({
      listingId: row.listingId,
      categoryId: row.categoryId,
      createdAt: toDate(row.createdAt)
    })));

    await createManyInChunks(prisma.listingRevision, revisions.map((row) => ({
      id: row.id,
      listingId: row.listingId,
      slug: row.slug,
      title: row.title,
      description: row.description,
      status: row.status,
      latitude: row.latitude,
      longitude: row.longitude,
      details: toJson(row.details),
      primaryCategoryId: row.primaryCategoryId,
      createdById: row.createdById,
      updatedById: row.updatedById,
      createdAt: toDate(row.createdAt),
      updatedAt: toDate(row.updatedAt)
    })));

    await createManyInChunks(prisma.listingRevisionCategoryAssignment, revisionAssignments.map((row) => ({
      revisionId: row.revisionId,
      categoryId: row.categoryId,
      createdAt: toDate(row.createdAt)
    })));

    await createManyInChunks(prisma.listingRevisionPhoto, revisionPhotos.map((row) => ({
      id: row.id,
      revisionId: row.revisionId,
      assetId: row.assetId,
      photoSectionId: row.photoSectionId,
      alt: row.alt,
      sortOrder: row.sortOrder,
      isCover: toBoolean(row.isCover),
      createdAt: toDate(row.createdAt),
      updatedAt: toDate(row.updatedAt)
    })));

    for (const row of listings) {
      await prisma.listing.update({
        where: { id: row.id },
        data: {
          currentPublishedRevisionId: row.currentPublishedRevisionId,
          currentDraftRevisionId: row.currentDraftRevisionId
        }
      });
    }

    console.log("SQLite import complete.");
    console.log(JSON.stringify({
      users: users.length,
      sections: sections.length,
      schemas: schemas.length,
      categories: categories.length,
      listings: listings.length,
      revisions: revisions.length,
      suggestions: suggestions.length,
      sliders: sliders.length,
      slides: slides.length,
      photoAssets: photoAssets.length,
      revisionPhotos: revisionPhotos.length
    }, null, 2));
  } finally {
    sqlite.close();
  }
}

main()
  .catch((error) => {
    console.error("Failed to import SQLite data into PostgreSQL", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
