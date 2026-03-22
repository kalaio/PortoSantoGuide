import { NextResponse } from "next/server";
import { ListingRevisionStatus, Prisma } from "@prisma/client";
import { mockListings } from "@/data/mockListings";
import { canManageAdmin, requireRequestAuthUser } from "@/lib/admin-auth";
import { requireTrustedMutationOrigin } from "@/lib/api-security";
import { validateListingPayloadAgainstSchemaFields } from "@/lib/listing-schema-validation";
import { parseDetailsBySchemaFields, normalizeDetailsIssues } from "@/lib/listing-details-validation";
import { createListingSchema, listQuerySchema } from "@/lib/listings-validation";
import { prisma } from "@/lib/prisma";

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parsed = listQuerySchema.safeParse({
    category: searchParams.get("category") ?? undefined,
    limit: searchParams.get("limit") ?? undefined
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid query parameters",
        issues: parsed.error.issues
      },
      { status: 400 }
    );
  }

  const { category, limit } = parsed.data;

  if (!hasDatabaseUrl()) {
    const filtered = mockListings.filter((listing) => {
      const categoryMatches = category
        ? listing.categories.some((item) => item.slug === category)
        : true;

      return categoryMatches;
    });

    return NextResponse.json({
      data: filtered.slice(0, limit ?? 50),
      count: filtered.length,
      source: "mock"
    });
  }

  const where: Prisma.ListingWhereInput = {
    status: "PUBLISHED",
    primaryCategory: {
      isActive: true,
      section: {
        isActive: true
      }
    },
    categories: category
      ? {
          some: {
            category: {
              slug: category,
              isActive: true
            }
          }
        }
      : undefined
  };

  const listings = await prisma.listing.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    take: limit ?? 50,
    include: {
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
                  slug: true,
                  label: true
                }
              }
            }
          }
        }
      }
    }
  });

  const data = listings
    .filter((listing) => listing.currentPublishedRevision)
    .map((listing) => ({
      id: listing.id,
      slug: listing.currentPublishedRevision?.slug ?? listing.slug,
      title: listing.currentPublishedRevision?.title ?? listing.title,
      status: listing.status,
      latitude: listing.currentPublishedRevision?.latitude ?? listing.latitude,
      longitude: listing.currentPublishedRevision?.longitude ?? listing.longitude,
      rating: listing.rating,
      details: listing.currentPublishedRevision?.details ?? listing.details,
      description: listing.currentPublishedRevision?.description ?? listing.description,
      primaryCategory: listing.currentPublishedRevision?.primaryCategory,
      categories: listing.currentPublishedRevision?.categories.map((item) => item.category) ?? []
    }));

  return NextResponse.json({ data, count: data.length });
}

export async function POST(request: Request) {
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
  if (!authUser || !canManageAdmin(authUser)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createListingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid listing payload",
        issues: parsed.error.issues
      },
      { status: 400 }
    );
  }

  const uniqueCategoryIds = [...new Set(parsed.data.categoryIds)];
  const categories = await prisma.listingCategory.findMany({
    where: {
      id: { in: uniqueCategoryIds },
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
          }
        }
      }
    }
  });

  if (categories.length !== uniqueCategoryIds.length) {
    return buildCategoryValidationError("One or more categories are invalid or inactive");
  }

  const primaryCategory = categories.find((item) => item.id === parsed.data.primaryCategoryId);
  if (!primaryCategory) {
    return buildCategoryValidationError("Primary category is invalid");
  }

  const hasCrossSectionCategories = categories.some(
    (item) => item.sectionId !== primaryCategory.sectionId
  );
  if (hasCrossSectionCategories) {
    return buildCategoryValidationError("All categories must belong to the same section");
  }

  const parsedDetails = parseDetailsBySchemaFields(primaryCategory.schema?.fields ?? [], parsed.data.details);
  if (!parsedDetails.success) {
    return NextResponse.json(
      {
        error: "Invalid listing payload",
        issues: normalizeDetailsIssues(parsedDetails.error.issues)
      },
      { status: 400 }
    );
  }

  const schemaIssues = validateListingPayloadAgainstSchemaFields({
    description: parsed.data.description,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
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
    const created = await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.create({
        data: {
          slug: parsed.data.slug,
          title: parsed.data.title,
          status: parsed.data.status,
          description: parsed.data.description,
          latitude: parsed.data.latitude,
          longitude: parsed.data.longitude,
          details: parsedDetails.data as Prisma.InputJsonValue,
          primaryCategory: {
            connect: {
              id: parsed.data.primaryCategoryId
            }
          },
          owner: {
            connect: {
              id: authUser.userId
            }
          },
          categories: {
            create: uniqueCategoryIds.map((categoryId) => ({ categoryId }))
          }
        },
        select: {
          id: true,
          slug: true,
          status: true
        }
      });

      const revision = await tx.listingRevision.create({
        data: {
          listingId: listing.id,
          slug: parsed.data.slug,
          title: parsed.data.title,
          description: parsed.data.description,
          status: parsed.data.status === "DRAFT" ? ListingRevisionStatus.DRAFT : ListingRevisionStatus.PUBLISHED,
          latitude: parsed.data.latitude,
          longitude: parsed.data.longitude,
          details: parsedDetails.data as Prisma.InputJsonValue,
          primaryCategoryId: parsed.data.primaryCategoryId,
          createdById: authUser.userId,
          updatedById: authUser.userId,
          categories: {
            create: uniqueCategoryIds.map((categoryId) => ({ categoryId }))
          }
        },
        select: {
          id: true
        }
      });

      return tx.listing.update({
        where: { id: listing.id },
        data:
          parsed.data.status === "DRAFT"
            ? {
                currentDraftRevision: {
                  connect: {
                    id: revision.id
                  }
                }
              }
            : {
                currentPublishedRevision: {
                  connect: {
                    id: revision.id
                  }
                }
              },
        include: {
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
                      slug: true,
                      label: true
                    }
                  }
                }
              }
            }
          },
          currentDraftRevision: {
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
                      slug: true,
                      label: true
                    }
                  }
                }
              }
            }
          }
        }
      });
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Could not create listing" }, { status: 500 });
  }
}
