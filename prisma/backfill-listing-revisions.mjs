import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const listings = await prisma.listing.findMany({
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
      ownerId: true,
      currentPublishedRevisionId: true,
      currentDraftRevisionId: true,
      categories: {
        select: {
          categoryId: true
        }
      }
    }
  });

  for (const listing of listings) {
    if ((listing.status === "PUBLISHED" || listing.status === "ARCHIVED") && !listing.currentPublishedRevisionId) {
      const publishedRevision = await prisma.listingRevision.create({
        data: {
          listingId: listing.id,
          slug: listing.slug,
          title: listing.title,
          description: listing.description,
          status: "PUBLISHED",
          latitude: listing.latitude,
          longitude: listing.longitude,
          details: listing.details,
          primaryCategoryId: listing.primaryCategoryId,
          createdById: listing.ownerId,
          updatedById: listing.ownerId,
          categories: {
            create: listing.categories.map((item) => ({
              categoryId: item.categoryId
            }))
          }
        },
        select: {
          id: true
        }
      });

      await prisma.listing.update({
        where: { id: listing.id },
        data: {
          currentPublishedRevisionId: publishedRevision.id
        }
      });
    }

    if (listing.status === "DRAFT" && !listing.currentDraftRevisionId) {
      const draftRevision = await prisma.listingRevision.create({
        data: {
          listingId: listing.id,
          slug: listing.slug,
          title: listing.title,
          description: listing.description,
          status: "DRAFT",
          latitude: listing.latitude,
          longitude: listing.longitude,
          details: listing.details,
          primaryCategoryId: listing.primaryCategoryId,
          createdById: listing.ownerId,
          updatedById: listing.ownerId,
          categories: {
            create: listing.categories.map((item) => ({
              categoryId: item.categoryId
            }))
          }
        },
        select: {
          id: true
        }
      });

      await prisma.listing.update({
        where: { id: listing.id },
        data: {
          currentDraftRevisionId: draftRevision.id
        }
      });
    }
  }
}

main()
  .catch((error) => {
    console.error("Failed to backfill listing revisions", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
