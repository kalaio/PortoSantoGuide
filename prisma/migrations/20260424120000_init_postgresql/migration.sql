-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMINISTRATOR', 'OWNER', 'SUBSCRIBER');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ListingRevisionStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectorySection" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DirectorySection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingSchema" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingSchema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingSchemaField" (
    "schemaId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isFrontendFilterEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ListingSchemaField_pkey" PRIMARY KEY ("schemaId","fieldKey")
);

-- CreateTable
CREATE TABLE "ListingCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "iconName" TEXT,
    "sectionId" TEXT NOT NULL,
    "schemaId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "key" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "SearchSuggestion" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "details" JSONB,
    "primaryCategoryId" TEXT NOT NULL,
    "currentPublishedRevisionId" TEXT,
    "currentDraftRevisionId" TEXT,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingRevision" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ListingRevisionStatus" NOT NULL DEFAULT 'DRAFT',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "details" JSONB,
    "primaryCategoryId" TEXT NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingRevisionCategoryAssignment" (
    "revisionId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingRevisionCategoryAssignment_pkey" PRIMARY KEY ("revisionId","categoryId")
);

-- CreateTable
CREATE TABLE "ListingSchemaPhotoSection" (
    "id" TEXT NOT NULL,
    "schemaId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingSchemaPhotoSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotoAsset" (
    "id" TEXT NOT NULL,
    "originalPath" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhotoAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingRevisionPhoto" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "photoSectionId" TEXT,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingRevisionPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingCategoryAssignment" (
    "listingId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingCategoryAssignment_pkey" PRIMARY KEY ("listingId","categoryId")
);

-- CreateTable
CREATE TABLE "Slider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Slider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Slide" (
    "id" TEXT NOT NULL,
    "sliderId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "mediaDesktop" TEXT,
    "mediaDesktopThumb" TEXT,
    "mediaMobile" TEXT,
    "mediaMobileThumb" TEXT,
    "videoUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Slide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DirectorySection_slug_key" ON "DirectorySection"("slug");

-- CreateIndex
CREATE INDEX "DirectorySection_isActive_sortOrder_idx" ON "DirectorySection"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ListingSchema_slug_key" ON "ListingSchema"("slug");

-- CreateIndex
CREATE INDEX "ListingSchema_isActive_sortOrder_idx" ON "ListingSchema"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "ListingSchemaField_schemaId_sortOrder_idx" ON "ListingSchemaField"("schemaId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ListingCategory_slug_key" ON "ListingCategory"("slug");

-- CreateIndex
CREATE INDEX "ListingCategory_sectionId_isActive_sortOrder_idx" ON "ListingCategory"("sectionId", "isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenId_key" ON "Session"("tokenId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "RateLimitBucket_scope_updatedAt_idx" ON "RateLimitBucket"("scope", "updatedAt");

-- CreateIndex
CREATE INDEX "SearchSuggestion_isActive_priority_idx" ON "SearchSuggestion"("isActive", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_slug_key" ON "Listing"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_currentPublishedRevisionId_key" ON "Listing"("currentPublishedRevisionId");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_currentDraftRevisionId_key" ON "Listing"("currentDraftRevisionId");

-- CreateIndex
CREATE INDEX "Listing_ownerId_idx" ON "Listing"("ownerId");

-- CreateIndex
CREATE INDEX "Listing_ownerId_updatedAt_idx" ON "Listing"("ownerId", "updatedAt");

-- CreateIndex
CREATE INDEX "Listing_primaryCategoryId_idx" ON "Listing"("primaryCategoryId");

-- CreateIndex
CREATE INDEX "Listing_status_createdAt_idx" ON "Listing"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Listing_status_updatedAt_idx" ON "Listing"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "ListingRevision_listingId_idx" ON "ListingRevision"("listingId");

-- CreateIndex
CREATE INDEX "ListingRevision_listingId_status_updatedAt_idx" ON "ListingRevision"("listingId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "ListingRevision_primaryCategoryId_idx" ON "ListingRevision"("primaryCategoryId");

-- CreateIndex
CREATE INDEX "ListingRevision_status_updatedAt_idx" ON "ListingRevision"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "ListingRevisionCategoryAssignment_categoryId_idx" ON "ListingRevisionCategoryAssignment"("categoryId");

-- CreateIndex
CREATE INDEX "ListingSchemaPhotoSection_schemaId_isActive_sortOrder_idx" ON "ListingSchemaPhotoSection"("schemaId", "isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ListingSchemaPhotoSection_schemaId_slug_key" ON "ListingSchemaPhotoSection"("schemaId", "slug");

-- CreateIndex
CREATE INDEX "ListingRevisionPhoto_assetId_idx" ON "ListingRevisionPhoto"("assetId");

-- CreateIndex
CREATE INDEX "ListingRevisionPhoto_photoSectionId_idx" ON "ListingRevisionPhoto"("photoSectionId");

-- CreateIndex
CREATE INDEX "ListingRevisionPhoto_revisionId_sortOrder_idx" ON "ListingRevisionPhoto"("revisionId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ListingRevisionPhoto_revisionId_assetId_key" ON "ListingRevisionPhoto"("revisionId", "assetId");

-- CreateIndex
CREATE INDEX "ListingCategoryAssignment_categoryId_idx" ON "ListingCategoryAssignment"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Slider_slug_key" ON "Slider"("slug");

-- CreateIndex
CREATE INDEX "Slide_sliderId_order_idx" ON "Slide"("sliderId", "order");

-- AddForeignKey
ALTER TABLE "ListingSchemaField" ADD CONSTRAINT "ListingSchemaField_schemaId_fkey" FOREIGN KEY ("schemaId") REFERENCES "ListingSchema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingCategory" ADD CONSTRAINT "ListingCategory_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "DirectorySection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingCategory" ADD CONSTRAINT "ListingCategory_schemaId_fkey" FOREIGN KEY ("schemaId") REFERENCES "ListingSchema"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_primaryCategoryId_fkey" FOREIGN KEY ("primaryCategoryId") REFERENCES "ListingCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_currentPublishedRevisionId_fkey" FOREIGN KEY ("currentPublishedRevisionId") REFERENCES "ListingRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_currentDraftRevisionId_fkey" FOREIGN KEY ("currentDraftRevisionId") REFERENCES "ListingRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingRevision" ADD CONSTRAINT "ListingRevision_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingRevision" ADD CONSTRAINT "ListingRevision_primaryCategoryId_fkey" FOREIGN KEY ("primaryCategoryId") REFERENCES "ListingCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingRevision" ADD CONSTRAINT "ListingRevision_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingRevision" ADD CONSTRAINT "ListingRevision_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingRevisionCategoryAssignment" ADD CONSTRAINT "ListingRevisionCategoryAssignment_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "ListingRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingRevisionCategoryAssignment" ADD CONSTRAINT "ListingRevisionCategoryAssignment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ListingCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingSchemaPhotoSection" ADD CONSTRAINT "ListingSchemaPhotoSection_schemaId_fkey" FOREIGN KEY ("schemaId") REFERENCES "ListingSchema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingRevisionPhoto" ADD CONSTRAINT "ListingRevisionPhoto_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "ListingRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingRevisionPhoto" ADD CONSTRAINT "ListingRevisionPhoto_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "PhotoAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingRevisionPhoto" ADD CONSTRAINT "ListingRevisionPhoto_photoSectionId_fkey" FOREIGN KEY ("photoSectionId") REFERENCES "ListingSchemaPhotoSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingCategoryAssignment" ADD CONSTRAINT "ListingCategoryAssignment_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingCategoryAssignment" ADD CONSTRAINT "ListingCategoryAssignment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ListingCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Slide" ADD CONSTRAINT "Slide_sliderId_fkey" FOREIGN KEY ("sliderId") REFERENCES "Slider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
