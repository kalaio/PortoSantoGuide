import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";

const searchQuerySchema = z.object({
  q: z.string().trim().max(120).optional()
});

const SEARCH_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const SEARCH_RATE_LIMIT_MAX_REQUESTS = 60;

function scoreSearchResult(
  result: {
    slug: string;
    title: string;
    details: unknown;
    primaryCategory: { label: string };
    categories: Array<{ category: { label: string } }>;
  },
  normalizedQuery: string
) {
  const normalizedSlug = result.slug.toLowerCase();
  const normalizedTitle = result.title.toLowerCase();
  const normalizedPrimaryCategory = result.primaryCategory.label.toLowerCase();
  const normalizedCategoryLabels = result.categories.map((item) => item.category.label.toLowerCase());
  const normalizedDetails = JSON.stringify(result.details ?? {}).toLowerCase();

  if (normalizedSlug === normalizedQuery) {
    return 500;
  }

  if (normalizedTitle === normalizedQuery) {
    return 450;
  }

  if (normalizedSlug.startsWith(normalizedQuery)) {
    return 300;
  }

  if (normalizedTitle.startsWith(normalizedQuery)) {
    return 220;
  }

  if (normalizedPrimaryCategory.startsWith(normalizedQuery)) {
    return 140;
  }

  if (normalizedCategoryLabels.some((label) => label.startsWith(normalizedQuery))) {
    return 120;
  }

  if (normalizedTitle.includes(normalizedQuery)) {
    return 100;
  }

  if (normalizedDetails.includes(normalizedQuery)) {
    return 40;
  }

  return 0;
}

export async function GET(request: Request) {
  const searchRateLimit = await consumeRateLimit({
    scope: "public-search",
    key: `public-search:${getClientIp(request)}`,
    limit: SEARCH_RATE_LIMIT_MAX_REQUESTS,
    windowMs: SEARCH_RATE_LIMIT_WINDOW_MS
  });

  if (!searchRateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many search requests. Try again in a moment." },
      { status: 429, headers: { "Retry-After": String(searchRateLimit.retryAfterSeconds) } }
    );
  }

  const { searchParams } = new URL(request.url);

  const parsed = searchQuerySchema.safeParse({
    q: searchParams.get("q") ?? undefined
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const q = parsed.data.q ?? "";
  const normalizedQuery = q.trim().toLowerCase();

  const suggestions =
    q.length < 2
      ? await prisma.searchSuggestion.findMany({
          where: {
            isActive: true
          },
          orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
          take: 6,
          select: {
            id: true,
            label: true,
            query: true
          }
        })
      : [];

  const results =
    q.length >= 2
      ? await prisma.listing.findMany({
          where: {
            status: "PUBLISHED",
            currentPublishedRevisionId: {
              not: null
            },
            primaryCategory: {
              isActive: true,
              section: {
                isActive: true
              }
            },
            OR: [
              { slug: { startsWith: q } },
              { title: { contains: q } },
              { primaryCategory: { label: { startsWith: q } } },
              {
                categories: {
                  some: {
                    category: {
                      label: { startsWith: q }
                    }
                  }
                }
              },
              ...(normalizedQuery.length >= 3 ? [{ description: { contains: q } }] : [])
            ]
          },
          orderBy: [{ updatedAt: "desc" }],
          take: 20,
          select: {
            id: true,
            slug: true,
            currentPublishedRevision: {
              select: {
                slug: true,
                title: true,
                details: true,
                primaryCategory: {
                  select: {
                    section: {
                      select: {
                        slug: true
                      }
                    },
                    slug: true,
                    label: true,
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
        })
      : [];

  const normalizedResults = results
    .filter((result) => result.currentPublishedRevision)
    .map((result) => ({
      id: result.id,
      slug: result.currentPublishedRevision?.slug ?? result.slug,
      title: result.currentPublishedRevision?.title ?? "",
      details: result.currentPublishedRevision?.details ?? null,
      primaryCategory: {
        slug: result.currentPublishedRevision?.primaryCategory.slug ?? "",
        label: result.currentPublishedRevision?.primaryCategory.label ?? "",
        schema: result.currentPublishedRevision?.primaryCategory.schema
        ? {
            fields: result.currentPublishedRevision.primaryCategory.schema.fields
          }
        : null
      },
      categories:
        result.currentPublishedRevision?.categories.map((item) => ({
          category: item.category
        })) ?? []
    }))
    .sort((left, right) => scoreSearchResult(right, normalizedQuery) - scoreSearchResult(left, normalizedQuery))
    .slice(0, 8);

  return NextResponse.json({
    query: q,
    suggestions,
    results: normalizedResults
  });
}
