import { NextResponse } from "next/server";
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
      ownerId: true,
      currentDraftRevisionId: true
    }
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (authUser.role === "OWNER" && listing.ownerId !== authUser.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!listing.currentDraftRevisionId) {
    return NextResponse.json({ error: "No draft to discard" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.listing.update({
        where: { id: listing.id },
        data: {
          currentDraftRevision: {
            disconnect: true
          }
        }
      });

      await tx.listingRevision.delete({
        where: {
          id: listing.currentDraftRevisionId as string
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Could not discard draft" }, { status: 500 });
  }
}
