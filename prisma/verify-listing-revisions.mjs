import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function formatList(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

async function main() {
  const listings = await prisma.listing.findMany({
    select: {
      id: true,
      slug: true,
      status: true,
      currentPublishedRevisionId: true,
      currentDraftRevisionId: true,
      currentPublishedRevision: {
        select: {
          id: true,
          listingId: true,
          slug: true,
          status: true,
          primaryCategoryId: true,
          categories: {
            select: {
              categoryId: true
            }
          }
        }
      },
      currentDraftRevision: {
        select: {
          id: true,
          listingId: true,
          slug: true,
          status: true,
          primaryCategoryId: true,
          categories: {
            select: {
              categoryId: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  const failures = [];
  const warnings = [];

  for (const listing of listings) {
    const label = `${listing.slug} (${listing.id})`;
    const publishedRevision = listing.currentPublishedRevision;
    const draftRevision = listing.currentDraftRevision;

    if ((listing.status === "PUBLISHED" || listing.status === "ARCHIVED") && !listing.currentPublishedRevisionId) {
      failures.push(`${label}: live listing is missing currentPublishedRevisionId`);
    }

    if (listing.status === "DRAFT" && !listing.currentDraftRevisionId) {
      failures.push(`${label}: draft listing is missing currentDraftRevisionId`);
    }

    if (listing.currentPublishedRevisionId && !publishedRevision) {
      failures.push(`${label}: currentPublishedRevisionId points to a missing revision`);
    }

    if (listing.currentDraftRevisionId && !draftRevision) {
      failures.push(`${label}: currentDraftRevisionId points to a missing revision`);
    }

    if (publishedRevision) {
      if (publishedRevision.listingId !== listing.id) {
        failures.push(`${label}: published revision belongs to another listing`);
      }

      if (publishedRevision.status !== "PUBLISHED") {
        failures.push(`${label}: current published revision is not in PUBLISHED state`);
      }

      if (!publishedRevision.categories.some((item) => item.categoryId === publishedRevision.primaryCategoryId)) {
        failures.push(`${label}: published revision categories do not include primary category`);
      }
    }

    if (draftRevision) {
      if (draftRevision.listingId !== listing.id) {
        failures.push(`${label}: draft revision belongs to another listing`);
      }

      if (draftRevision.status !== "DRAFT") {
        failures.push(`${label}: current draft revision is not in DRAFT state`);
      }

      if (!draftRevision.categories.some((item) => item.categoryId === draftRevision.primaryCategoryId)) {
        failures.push(`${label}: draft revision categories do not include primary category`);
      }
    }

    if (
      listing.currentPublishedRevisionId &&
      listing.currentDraftRevisionId &&
      listing.currentPublishedRevisionId === listing.currentDraftRevisionId
    ) {
      failures.push(`${label}: published and draft revisions point to the same revision`);
    }

    if (listing.status === "ARCHIVED" && draftRevision) {
      warnings.push(`${label}: archived listing still has a draft revision`);
    }

    if (listing.status === "PUBLISHED" && draftRevision && publishedRevision && draftRevision.slug === publishedRevision.slug) {
      warnings.push(`${label}: published and draft revisions share the same slug; verify publish/discard behavior intentionally`);
    }
  }

  const summary = {
    totalListings: listings.length,
    published: listings.filter((listing) => listing.status === "PUBLISHED").length,
    archived: listings.filter((listing) => listing.status === "ARCHIVED").length,
    draft: listings.filter((listing) => listing.status === "DRAFT").length,
    withDraftRevision: listings.filter((listing) => Boolean(listing.currentDraftRevisionId)).length,
    withPublishedRevision: listings.filter((listing) => Boolean(listing.currentPublishedRevisionId)).length
  };

  console.log("Listing revision verification summary");
  console.log(JSON.stringify(summary, null, 2));

  if (warnings.length > 0) {
    console.log("\nWarnings");
    console.log(formatList(warnings));
  }

  if (failures.length > 0) {
    console.error("\nIntegrity failures");
    console.error(formatList(failures));
    process.exitCode = 1;
    return;
  }

  console.log("\nIntegrity check passed.");
}

main()
  .catch((error) => {
    console.error("Failed to verify listing revisions", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
