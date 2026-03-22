import { NextResponse } from "next/server";
import { ListingRevisionStatus, ListingStatus, Prisma } from "@prisma/client";
import { requireRequestAuthUser } from "@/lib/admin-auth";
import { requireTrustedMutationOrigin } from "@/lib/api-security";
import { prisma } from "@/lib/prisma";

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
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
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      ownerId: true,
      status: true,
      currentPublishedRevisionId: true,
      categories: {
        select: {
          categoryId: true
        }
      },
      currentDraftRevisionId: true,
      currentDraftRevision: {
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

  if (listing.currentDraftRevision) {
    const draft = listing.currentDraftRevision;
    const categoryIds = draft.categories.map((item: { categoryId: string }) => item.categoryId);

    const categories = await prisma.listingCategory.findMany({
      where: {
        id: { in: categoryIds },
        isActive: true,
        section: {
          isActive: true
        }
      },
      select: {
        id: true
      }
    });

    if (categories.length !== categoryIds.length) {
      return NextResponse.json(
        { error: "Cannot publish draft because one or more categories are inactive." },
        { status: 409 }
      );
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.listingRevision.update({
          where: {
            id: draft.id
          },
          data: {
            status: ListingRevisionStatus.PUBLISHED,
            updatedById: authUser.userId
          }
        });

        await tx.listing.update({
          where: { id: listing.id },
          data: {
            slug: draft.slug,
            title: draft.title,
            status: ListingStatus.PUBLISHED,
            description: draft.description,
            latitude: draft.latitude,
            longitude: draft.longitude,
            details: draft.details as Prisma.InputJsonValue,
            currentPublishedRevision: {
              connect: {
                id: draft.id
              }
            },
            currentDraftRevision: {
              disconnect: true
            },
            primaryCategory: {
              connect: {
                id: draft.primaryCategoryId
              }
            }
          }
        });

        await tx.listingCategoryAssignment.deleteMany({
          where: {
            listingId: listing.id
          }
        });

        await tx.listingCategoryAssignment.createMany({
          data: categoryIds.map((categoryId: string) => ({
            listingId: listing.id,
            categoryId
          }))
        });

        if (listing.currentPublishedRevisionId && listing.currentPublishedRevisionId !== draft.id) {
          await tx.listingRevision.delete({
            where: {
              id: listing.currentPublishedRevisionId
            }
          });
        }
      });

      return NextResponse.json({
        data: {
          slug: draft.slug,
          status: ListingStatus.PUBLISHED
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
      }

      return NextResponse.json({ error: "Could not publish draft" }, { status: 500 });
    }
  }

  if (listing.status === ListingStatus.PUBLISHED) {
    return NextResponse.json({ error: "Listing is already published" }, { status: 400 });
  }

  try {
    if (!listing.currentPublishedRevisionId) {
      return NextResponse.json({ error: "Listing has no published revision to restore." }, { status: 409 });
    }

    const updated = await prisma.listing.update({
      where: { id: listing.id },
      data: {
        status: ListingStatus.PUBLISHED
      },
      select: {
        slug: true,
        status: true
      }
    });

    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: "Could not publish listing" }, { status: 500 });
  }
}
