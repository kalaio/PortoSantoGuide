import { NextResponse } from "next/server";
import { canManageAdmin, requireRequestAuthUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const authUser = await requireRequestAuthUser(_request);
  if (!authUser || !canManageAdmin(authUser)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      { error: "Database not configured. Set DATABASE_URL in .env.local and restart dev server." },
      { status: 503 }
    );
  }

  const { slug } = await context.params;

  const listing = await prisma.listing.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      currentPublishedRevisionId: {
        not: null
      },
      primaryCategory: {
        isActive: true,
        section: {
          isActive: true
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
      }
    }
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (!listing.currentPublishedRevision) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      id: listing.id,
      slug: listing.currentPublishedRevision.slug,
      title: listing.currentPublishedRevision.title,
      description: listing.currentPublishedRevision.description,
      status: listing.status,
      latitude: listing.currentPublishedRevision.latitude,
      longitude: listing.currentPublishedRevision.longitude,
      rating: listing.rating,
      details: listing.currentPublishedRevision.details,
      primaryCategory: listing.currentPublishedRevision.primaryCategory,
      categories: listing.currentPublishedRevision.categories.map((item) => item.category)
    }
  });
}
