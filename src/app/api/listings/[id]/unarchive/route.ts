import { NextResponse } from "next/server";
import { ListingStatus } from "@prisma/client";
import { requireRequestAuthUser } from "@/app/(admin)/lib/admin-auth";
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
      ownerId: true,
      status: true,
      currentPublishedRevisionId: true
    }
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (authUser.role === "OWNER" && listing.ownerId !== authUser.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (listing.status !== ListingStatus.ARCHIVED) {
    return NextResponse.json({ error: "Listing is not archived" }, { status: 400 });
  }

  if (!listing.currentPublishedRevisionId) {
    return NextResponse.json({ error: "Archived listing has no published revision to restore." }, { status: 409 });
  }

  try {
    const updated = await prisma.listing.update({
      where: { id: listing.id },
      data: {
        status: ListingStatus.PUBLISHED
      },
      select: {
        status: true
      }
    });

    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: "Could not unarchive listing" }, { status: 500 });
  }
}
