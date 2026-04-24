import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getDetailsSummaryByFields, getFoodOpeningStatus } from "@/lib/listing-details";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";

const searchQuerySchema = z.object({
  q: z.string().trim().max(120).optional()
});

const SEARCH_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const SEARCH_RATE_LIMIT_MAX_REQUESTS = 60;
const SEARCH_RESULTS_QUERY_LIMIT = 12;
const SEARCH_RESULTS_RESPONSE_LIMIT = 8;
const MIN_ADVANCED_SEARCH_CHARACTERS = 4;

const listingSearchResultSelect = Prisma.validator<Prisma.ListingSelect>()({
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
                  isRequired: true,
                  isFrontendFilterEnabled: true
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
      },
      photos: {
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
        take: 1,
        select: {
          alt: true,
          asset: {
            select: {
              originalPath: true,
              thumbnailPath: true
            }
          }
        }
      }
    }
  }
});

type ListingSearchRecord = Prisma.ListingGetPayload<{ select: typeof listingSearchResultSelect }>;

function normalizeSearchText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ");
}

function getTrigramThreshold(normalizedQuery: string) {
  if (normalizedQuery.length >= 9) {
    return 0.18;
  }

  if (normalizedQuery.length >= 6) {
    return 0.22;
  }

  return 0.28;
}

function scoreSearchResult(
  result: {
    slug: string;
    title: string;
    primaryCategory: { label: string };
    categoryLabels: string[];
  },
  normalizedQuery: string
) {
  const normalizedSlug = result.slug.toLowerCase();
  const normalizedTitle = result.title.toLowerCase();
  const normalizedPrimaryCategory = result.primaryCategory.label.toLowerCase();
  const normalizedCategoryLabels = result.categoryLabels;

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

  return 0;
}

function mapSearchResults(results: ListingSearchRecord[], normalizedQuery: string) {
  return results
    .filter((result) => result.currentPublishedRevision)
    .map((result) => {
      const revision = result.currentPublishedRevision;
      const details = revision?.details ?? null;
      const fields = revision?.primaryCategory.schema?.fields ?? [];

      return {
        id: result.id,
        score: scoreSearchResult(
          {
            slug: revision?.slug ?? result.slug,
            title: revision?.title ?? "",
            primaryCategory: {
              label: revision?.primaryCategory.label ?? ""
            },
            categoryLabels: (revision?.categories ?? []).map((item) => normalizeSearchText(item.category.label))
          },
          normalizedQuery
        ),
        data: {
          id: result.id,
          slug: revision?.slug ?? result.slug,
          title: revision?.title ?? "",
          primaryCategory: {
            slug: revision?.primaryCategory.slug ?? "",
            label: revision?.primaryCategory.label ?? ""
          },
          summary: getDetailsSummaryByFields(fields, details),
          openingStatus: getFoodOpeningStatus(details),
          coverPhoto: revision?.photos[0]
            ? {
                alt: revision.photos[0].alt,
                path: revision.photos[0].asset.originalPath,
                thumbnailPath: revision.photos[0].asset.thumbnailPath
              }
            : null
        }
      };
    })
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.data)
    .slice(0, SEARCH_RESULTS_RESPONSE_LIMIT);
}

async function fetchListingsByIds(ids: string[]) {
  if (ids.length === 0) {
    return [];
  }

  const results = await prisma.listing.findMany({
    where: {
      id: {
        in: ids
      }
    },
    select: listingSearchResultSelect
  });

  const resultMap = new Map(results.map((result) => [result.id, result]));
  return ids.map((id) => resultMap.get(id)).filter((result): result is ListingSearchRecord => Boolean(result));
}

async function searchListingIdsWithPostgres(normalizedQuery: string) {
  const trigramThreshold = getTrigramThreshold(normalizedQuery);
  const prefixQuery = `${normalizedQuery}%`;
  const containsQuery = `%${normalizedQuery}%`;

  const descriptionSimilarityCondition =
    normalizedQuery.length >= 6
      ? Prisma.sql`OR similarity(description, ${normalizedQuery}) >= ${Math.max(0.2, trigramThreshold - 0.02)}`
      : Prisma.sql``;

  const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    WITH listing_search AS (
      SELECT
        l.id,
        l."updatedAt",
        public.immutable_unaccent(lower(COALESCE(r.slug, l.slug))) AS slug,
        public.immutable_unaccent(lower(COALESCE(r.title, l.title))) AS title,
        public.immutable_unaccent(lower(pc.label)) AS primary_category_label,
        public.immutable_unaccent(lower(COALESCE(string_agg(DISTINCT c.label, ' '), ''))) AS category_labels,
        public.immutable_unaccent(lower(COALESCE(r.description, l.description, ''))) AS description,
        setweight(to_tsvector('simple', public.immutable_unaccent(lower(COALESCE(r.title, l.title, '')))), 'A') ||
        setweight(to_tsvector('simple', public.immutable_unaccent(lower(pc.label))), 'A') ||
        setweight(to_tsvector('simple', public.immutable_unaccent(lower(COALESCE(string_agg(DISTINCT c.label, ' '), '')))), 'B') ||
        setweight(to_tsvector('simple', public.immutable_unaccent(lower(COALESCE(r.description, l.description, '')))), 'C') AS search_document
      FROM "Listing" l
      JOIN "ListingRevision" r ON r.id = l."currentPublishedRevisionId"
      JOIN "ListingCategory" pc ON pc.id = r."primaryCategoryId"
      JOIN "DirectorySection" section ON section.id = pc."sectionId"
      LEFT JOIN "ListingRevisionCategoryAssignment" rca ON rca."revisionId" = r.id
      LEFT JOIN "ListingCategory" c ON c.id = rca."categoryId"
      WHERE
        l."status" = 'PUBLISHED'::"ListingStatus"
        AND l."currentPublishedRevisionId" IS NOT NULL
        AND pc."isActive" = true
        AND section."isActive" = true
      GROUP BY l.id, l.slug, l.title, l.description, l."updatedAt", r.id, r.slug, r.title, r.description, pc.id, pc.label
    )
    SELECT id
    FROM listing_search
    WHERE
      search_document @@ websearch_to_tsquery('simple', ${normalizedQuery})
      OR similarity(slug, ${normalizedQuery}) >= ${trigramThreshold}
      OR similarity(title, ${normalizedQuery}) >= ${trigramThreshold}
      OR similarity(primary_category_label, ${normalizedQuery}) >= ${trigramThreshold}
      OR similarity(category_labels, ${normalizedQuery}) >= ${trigramThreshold}
      ${descriptionSimilarityCondition}
    ORDER BY
      (
        CASE
          WHEN slug = ${normalizedQuery} THEN 500
          WHEN title = ${normalizedQuery} THEN 450
          WHEN primary_category_label = ${normalizedQuery} THEN 320
          WHEN slug LIKE ${prefixQuery} THEN 280
          WHEN title LIKE ${prefixQuery} THEN 220
          WHEN primary_category_label LIKE ${prefixQuery} THEN 160
          WHEN category_labels LIKE ${containsQuery} THEN 120
          WHEN title LIKE ${containsQuery} THEN 90
          ELSE 0
        END
      )
      + ts_rank_cd(search_document, websearch_to_tsquery('simple', ${normalizedQuery})) * 140
      + GREATEST(
        similarity(slug, ${normalizedQuery}),
        similarity(title, ${normalizedQuery}),
        similarity(primary_category_label, ${normalizedQuery}),
        similarity(category_labels, ${normalizedQuery}),
        similarity(description, ${normalizedQuery}) * 0.5
      ) * 120 DESC,
      "updatedAt" DESC
    LIMIT ${SEARCH_RESULTS_QUERY_LIMIT}
  `);

  return rows.map((row) => row.id);
}

async function searchListingsWithFallback(q: string, normalizedQuery: string) {
  if (normalizedQuery.length >= MIN_ADVANCED_SEARCH_CHARACTERS && process.env.DATABASE_URL?.startsWith("postgres")) {
    try {
      const rankedIds = await searchListingIdsWithPostgres(normalizedQuery);
      if (rankedIds.length > 0) {
        return fetchListingsByIds(rankedIds);
      }
    } catch (error) {
      console.error("PostgreSQL search fallback triggered", error);
    }
  }

  return prisma.listing.findMany({
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
    take: SEARCH_RESULTS_QUERY_LIMIT,
    select: listingSearchResultSelect
  });
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
  const normalizedQuery = normalizeSearchText(q);

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

  const results = q.length >= 2 ? await searchListingsWithFallback(q, normalizedQuery) : [];
  const normalizedResults = mapSearchResults(results, normalizedQuery);

  return NextResponse.json({
    query: q,
    suggestions,
    results: normalizedResults
  });
}
