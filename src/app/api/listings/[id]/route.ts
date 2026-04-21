import { NextResponse } from "next/server";
import { ListingRevisionStatus, ListingStatus, Prisma } from "@prisma/client";
import { canManageAdmin, requireRequestAuthUser } from "@/app/(admin)/lib/admin-auth";
import { requireTrustedMutationOrigin } from "@/lib/api-security";
import { normalizeListingPhotoPayload, type NormalizedListingPhotoPayload } from "@/lib/listing-photos";
import { validateListingPayloadAgainstSchemaFields } from "@/lib/listing-schema-validation";
import { normalizeDetailsIssues, parseDetailsBySchemaFields } from "@/lib/listing-details-validation";
import { prisma } from "@/lib/prisma";
import { updateListingSchema } from "@/lib/listings-validation";

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

function buildCategoryValidationError(message: string) {
  return NextResponse.json(
    {
      error: "Invalid listing payload",
      issues: [
        {
          path: ["categoryIds"],
          message
        }
      ]
    },
    { status: 400 }
  );
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

type EditableListingSnapshot = {
  slug: string;
  title: string;
  status: ListingStatus;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  details: Prisma.JsonValue | null;
  primaryCategoryId: string;
  categoryIds: string[];
  photos: NormalizedListingPhotoPayload[];
};

type SnapshotPhotoRecord = {
  assetId: string;
  alt: string | null;
  sortOrder: number;
  isCover: boolean;
  photoSectionId: string | null;
};

function toSnapshotPhotos(photos: SnapshotPhotoRecord[]): NormalizedListingPhotoPayload[] {
  return normalizeListingPhotoPayload(
    photos.map((photo) => ({
      assetId: photo.assetId,
      photoSectionId: photo.photoSectionId,
      alt: photo.alt,
      sortOrder: photo.sortOrder,
      isCover: photo.isCover
    }))
  );
}

function getSnapshotFromListing(listing: {
  slug: string;
  title: string;
  status: ListingStatus;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  details: Prisma.JsonValue | null;
  primaryCategoryId: string;
  categories: Array<{ categoryId: string }>;
  photos?: SnapshotPhotoRecord[];
}): EditableListingSnapshot {
  return {
    slug: listing.slug,
    title: listing.title,
    status: listing.status,
    description: listing.description,
    latitude: listing.latitude,
    longitude: listing.longitude,
    details: listing.details,
    primaryCategoryId: listing.primaryCategoryId,
    categoryIds: listing.categories.map((item) => item.categoryId),
    photos: toSnapshotPhotos(listing.photos ?? [])
  };
}

function getSnapshotFromRevision(revision: {
  slug: string;
  title: string;
  status: ListingStatus;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  details: Prisma.JsonValue | null;
  primaryCategoryId: string;
  categories: Array<{ categoryId: string }>;
  photos?: SnapshotPhotoRecord[];
}): EditableListingSnapshot {
  return {
    slug: revision.slug,
    title: revision.title,
    status: revision.status,
    description: revision.description,
    latitude: revision.latitude,
    longitude: revision.longitude,
    details: revision.details,
    primaryCategoryId: revision.primaryCategoryId,
    categoryIds: revision.categories.map((item) => item.categoryId),
    photos: toSnapshotPhotos(revision.photos ?? [])
  };
}

function buildLiveUpdateData(snapshot: EditableListingSnapshot): Prisma.ListingUpdateInput {
  return {
    slug: snapshot.slug,
    title: snapshot.title,
    status: snapshot.status,
    description: snapshot.description,
    latitude: snapshot.latitude,
    longitude: snapshot.longitude,
    details: snapshot.details as Prisma.InputJsonValue,
    primaryCategory: {
      connect: {
        id: snapshot.primaryCategoryId
      }
    }
  };
}

export async function GET(request: Request, context: RouteContext) {
  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      { error: "Database not configured. Set DATABASE_URL in .env.local and restart dev server." },
      { status: 503 }
    );
  }

  const authUser = await requireRequestAuthUser(request);
  if (!authUser || !canManageAdmin(authUser)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      primaryCategory: {
        include: {
          section: {
            select: {
              slug: true,
              label: true
            }
          }
        }
      },
      categories: {
        select: {
          category: {
            select: {
              id: true,
              slug: true,
              label: true,
              sectionId: true
            }
          }
        }
      },
      currentDraftRevision: {
        include: {
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  slug: true,
                  label: true,
                  sectionId: true
                }
              }
            }
          }
        }
      }
      ,
      currentPublishedRevision: {
        include: {
          primaryCategory: {
            include: {
              section: {
                select: {
                  slug: true,
                  label: true
                }
              }
            }
          },
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  slug: true,
                  label: true,
                  sectionId: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (authUser.role === "OWNER" && listing.ownerId !== authUser.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ data: listing });
}

export async function PATCH(request: Request, context: RouteContext) {
  const originError = requireTrustedMutationOrigin(request);
  if (originError) {
    return originError;
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      { error: "Database not configured. Set DATABASE_URL in .env.local and restart dev server." },
      { status: 503 }
    );
  }

  const authUser = await requireRequestAuthUser(request);
  if (!authUser || authUser.role === "SUBSCRIBER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const existing = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      ownerId: true,
      details: true,
      primaryCategoryId: true,
      description: true,
      status: true,
      latitude: true,
      longitude: true,
      categories: {
        select: {
          categoryId: true
        }
      },
      currentPublishedRevisionId: true,
      currentPublishedRevision: {
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          latitude: true,
          longitude: true,
          details: true,
          primaryCategoryId: true,
          categories: {
            select: {
              categoryId: true
            }
          },
          photos: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            select: {
              assetId: true,
              alt: true,
              sortOrder: true,
              isCover: true,
              photoSectionId: true
            }
          }
        }
      },
      currentDraftRevisionId: true,
      currentDraftRevision: {
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          status: true,
          latitude: true,
          longitude: true,
          details: true,
          primaryCategoryId: true,
          categories: {
            select: {
              categoryId: true
            }
          },
          photos: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            select: {
              assetId: true,
              alt: true,
              sortOrder: true,
              isCover: true,
              photoSectionId: true
            }
          }
        }
      }
    }
  });

  if (!existing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (authUser.role === "OWNER" && existing.ownerId !== authUser.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateListingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid listing payload",
        issues: parsed.error.issues
      },
      { status: 400 }
    );
  }

  const source = existing.currentDraftRevision
    ? getSnapshotFromRevision({ ...existing.currentDraftRevision, status: existing.status })
    : existing.currentPublishedRevision
      ? getSnapshotFromRevision({ ...existing.currentPublishedRevision, status: existing.status })
      : getSnapshotFromListing(existing);

  const nextPrimaryCategoryId = parsed.data.primaryCategoryId ?? source.primaryCategoryId;
  const nextCategoryIds = parsed.data.categoryIds
    ? [...new Set(parsed.data.categoryIds)]
    : [...new Set(source.categoryIds)];
  const nextPhotos = parsed.data.photos ? normalizeListingPhotoPayload(parsed.data.photos) : source.photos;

  if (!nextCategoryIds.includes(nextPrimaryCategoryId)) {
    return buildCategoryValidationError("Primary category must be included in categoryIds");
  }

  const categories = await prisma.listingCategory.findMany({
    where: {
      id: { in: nextCategoryIds },
      isActive: true,
      section: {
        isActive: true
      }
    },
    select: {
      id: true,
      sectionId: true,
      schema: {
        select: {
          fields: {
            orderBy: [{ sortOrder: "asc" }, { fieldKey: "asc" }],
            select: {
              fieldKey: true,
              sortOrder: true,
              isRequired: true
            }
          },
          photoSections: {
            select: {
              id: true
            }
          }
        }
      }
    }
  });

  if (categories.length !== nextCategoryIds.length) {
    return buildCategoryValidationError("One or more categories are invalid or inactive");
  }

  const primaryCategory = categories.find((item) => item.id === nextPrimaryCategoryId);
  if (!primaryCategory) {
    return buildCategoryValidationError("Primary category is invalid");
  }

  if (categories.some((item) => item.sectionId !== primaryCategory.sectionId)) {
    return buildCategoryValidationError("All categories must belong to the same section");
  }

  const validPhotoSectionIds = new Set(primaryCategory.schema?.photoSections.map((section) => section.id) ?? []);
  const invalidPhoto = nextPhotos.find(
    (photo) => photo.photoSectionId !== null && !validPhotoSectionIds.has(photo.photoSectionId)
  );

  if (invalidPhoto) {
    return NextResponse.json(
      {
        error: "Invalid listing payload",
        issues: [
          {
            path: ["photos"],
            message: "One or more photos use a section that does not belong to the selected schema"
          }
        ]
      },
      { status: 400 }
    );
  }

  const assetIds = [...new Set(nextPhotos.map((photo) => photo.assetId))];
  if (assetIds.length > 0) {
    const existingAssets = await prisma.photoAsset.findMany({
      where: {
        id: {
          in: assetIds
        }
      },
      select: {
        id: true
      }
    });

    if (existingAssets.length !== assetIds.length) {
      return NextResponse.json(
        {
          error: "Invalid listing payload",
          issues: [
            {
              path: ["photos"],
              message: "One or more photo assets are missing"
            }
          ]
        },
        { status: 400 }
      );
    }
  }

  const parsedDetails = parseDetailsBySchemaFields(
    primaryCategory.schema?.fields ?? [],
    parsed.data.details ?? source.details ?? {}
  );

  if (!parsedDetails.success) {
    return NextResponse.json(
      {
        error: "Invalid listing payload",
        issues: normalizeDetailsIssues(parsedDetails.error.issues)
      },
      { status: 400 }
    );
  }

  const nextSnapshot: EditableListingSnapshot = {
    slug: parsed.data.slug ?? source.slug,
    title: parsed.data.title ?? source.title,
    status: existing.status === ListingStatus.DRAFT ? parsed.data.status ?? source.status : existing.status,
    description: parsed.data.description !== undefined ? parsed.data.description : source.description,
    latitude: parsed.data.latitude !== undefined ? parsed.data.latitude : source.latitude,
    longitude: parsed.data.longitude !== undefined ? parsed.data.longitude : source.longitude,
    details: parsedDetails.data,
    primaryCategoryId: nextPrimaryCategoryId,
    categoryIds: nextCategoryIds,
    photos: nextPhotos
  };

  const schemaIssues = validateListingPayloadAgainstSchemaFields({
    description: nextSnapshot.description,
    latitude: nextSnapshot.latitude,
    longitude: nextSnapshot.longitude,
    details: parsedDetails.data,
    schemaFields: primaryCategory.schema?.fields ?? []
  });

  if (schemaIssues.length > 0) {
    return NextResponse.json(
      {
        error: "Invalid listing payload",
        issues: schemaIssues
      },
      { status: 400 }
    );
  }

  try {
    const usesRevisionDraftWorkflow = Boolean(existing.currentPublishedRevisionId) || existing.status !== ListingStatus.DRAFT;

    if (usesRevisionDraftWorkflow) {
      await prisma.$transaction(async (tx) => {
        const revisionId = existing.currentDraftRevisionId ?? (await tx.listingRevision.create({
          data: {
            listingId: existing.id,
            createdById: authUser.userId,
            updatedById: authUser.userId,
            slug: nextSnapshot.slug,
            title: nextSnapshot.title,
            description: nextSnapshot.description,
            status: ListingRevisionStatus.DRAFT,
            latitude: nextSnapshot.latitude,
            longitude: nextSnapshot.longitude,
            details: nextSnapshot.details as Prisma.InputJsonValue,
            primaryCategoryId: nextSnapshot.primaryCategoryId
          },
          select: {
            id: true
          }
        })).id;

        await tx.listingRevision.update({
          where: { id: revisionId },
          data: {
            slug: nextSnapshot.slug,
            title: nextSnapshot.title,
            description: nextSnapshot.description,
            latitude: nextSnapshot.latitude,
            longitude: nextSnapshot.longitude,
            details: nextSnapshot.details as Prisma.InputJsonValue,
            updatedById: authUser.userId,
            status: ListingRevisionStatus.DRAFT,
            primaryCategoryId: nextSnapshot.primaryCategoryId
          }
        });

        await tx.listingRevisionCategoryAssignment.deleteMany({
          where: {
            revisionId
          }
        });

        await tx.listingRevisionCategoryAssignment.createMany({
          data: nextSnapshot.categoryIds.map((categoryId) => ({
            revisionId,
            categoryId
          }))
        });

        await tx.listingRevisionPhoto.deleteMany({
          where: {
            revisionId
          }
        });

        if (nextSnapshot.photos.length > 0) {
          await tx.listingRevisionPhoto.createMany({
            data: nextSnapshot.photos.map((photo) => ({
              revisionId,
              assetId: photo.assetId,
              photoSectionId: photo.photoSectionId,
              alt: photo.alt,
              sortOrder: photo.sortOrder,
              isCover: photo.isCover
            }))
          });
        }

        if (!existing.currentDraftRevisionId) {
          await tx.listing.update({
            where: { id: existing.id },
            data: {
              currentDraftRevision: {
                connect: {
                  id: revisionId
                }
              }
            }
          });
        }
      });

      return NextResponse.json({
        data: {
          slug: nextSnapshot.slug
        },
        hasDraftRevision: true,
        mode: "draft"
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.listing.update({
        where: { id },
        data: buildLiveUpdateData(nextSnapshot)
      });

      await tx.listingCategoryAssignment.deleteMany({
        where: {
          listingId: id
        }
      });

      await tx.listingCategoryAssignment.createMany({
        data: nextSnapshot.categoryIds.map((categoryId) => ({
          listingId: id,
          categoryId
        }))
      });

      const revisionId = existing.currentDraftRevisionId ?? (await tx.listingRevision.create({
        data: {
          listingId: existing.id,
          slug: nextSnapshot.slug,
          title: nextSnapshot.title,
          description: nextSnapshot.description,
          status: ListingRevisionStatus.DRAFT,
          latitude: nextSnapshot.latitude,
          longitude: nextSnapshot.longitude,
          details: nextSnapshot.details as Prisma.InputJsonValue,
          primaryCategoryId: nextSnapshot.primaryCategoryId,
          createdById: authUser.userId,
          updatedById: authUser.userId
        },
        select: {
          id: true
        }
      })).id;

      await tx.listingRevision.update({
        where: { id: revisionId },
        data: {
          slug: nextSnapshot.slug,
          title: nextSnapshot.title,
          description: nextSnapshot.description,
          latitude: nextSnapshot.latitude,
          longitude: nextSnapshot.longitude,
          details: nextSnapshot.details as Prisma.InputJsonValue,
          updatedById: authUser.userId,
          status: ListingRevisionStatus.DRAFT,
          primaryCategoryId: nextSnapshot.primaryCategoryId
        }
      });

      await tx.listingRevisionCategoryAssignment.deleteMany({
        where: {
          revisionId
        }
      });

      await tx.listingRevisionCategoryAssignment.createMany({
        data: nextSnapshot.categoryIds.map((categoryId) => ({
          revisionId,
          categoryId
        }))
      });

      await tx.listingRevisionPhoto.deleteMany({
        where: {
          revisionId
        }
      });

      if (nextSnapshot.photos.length > 0) {
        await tx.listingRevisionPhoto.createMany({
          data: nextSnapshot.photos.map((photo) => ({
            revisionId,
            assetId: photo.assetId,
            photoSectionId: photo.photoSectionId,
            alt: photo.alt,
            sortOrder: photo.sortOrder,
            isCover: photo.isCover
          }))
        });
      }

      if (!existing.currentDraftRevisionId) {
        await tx.listing.update({
          where: { id: existing.id },
          data: {
            currentDraftRevision: {
              connect: {
                id: revisionId
              }
            }
          }
        });
      }
    });

    return NextResponse.json({
      data: {
        slug: nextSnapshot.slug
      },
      hasDraftRevision: false,
      mode: "live"
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Could not update listing" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const originError = requireTrustedMutationOrigin(request);
  if (originError) {
    return originError;
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      { error: "Database not configured. Set DATABASE_URL in .env.local and restart dev server." },
      { status: 503 }
    );
  }

  const authUser = await requireRequestAuthUser(request);
  if (!authUser || authUser.role === "SUBSCRIBER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const existing = await prisma.listing.findUnique({
    where: { id },
    select: { id: true, ownerId: true }
  });

  if (!existing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (authUser.role === "OWNER" && existing.ownerId !== authUser.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.listing.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Could not delete listing" }, { status: 500 });
  }
}
