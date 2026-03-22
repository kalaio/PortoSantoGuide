import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BASE_URL = process.env.LISTING_VERIFY_BASE_URL ?? "http://localhost:3010";
const ADMIN_USERNAME = process.env.LISTING_VERIFY_USERNAME ?? "administrator";
const ADMIN_PASSWORD = process.env.LISTING_VERIFY_PASSWORD ?? "admin123";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function fetchJson(pathname, options = {}, cookie = "") {
  const response = await fetch(`${BASE_URL}${pathname}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Origin: BASE_URL,
      Referer: `${BASE_URL}/admin`,
      ...(cookie ? { Cookie: cookie } : {}),
      ...(options.headers ?? {})
    }
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  return { response, data };
}

async function login() {
  const { response, data } = await fetchJson("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD
    })
  });

  assert(response.ok, `Admin login failed: ${data?.error ?? response.status}`);

  const cookie = response.headers.get("set-cookie");
  assert(cookie, "Login succeeded but no session cookie was returned.");

  return cookie.split(",")[0];
}

async function main() {
  console.log(`Verifying listing state workflow against ${BASE_URL}`);

  const template = await prisma.listing.findFirst({
    where: {
      status: "PUBLISHED",
      currentPublishedRevisionId: {
        not: null
      }
    },
    select: {
      id: true,
      currentPublishedRevision: {
        select: {
          primaryCategoryId: true,
          categories: {
            select: {
              categoryId: true
            }
          },
          primaryCategory: {
            select: {
              slug: true
            }
          },
          description: true,
          latitude: true,
          longitude: true,
          details: true,
          title: true
        }
      }
    }
  });

  assert(template?.currentPublishedRevision, "No published listing available to use as a verification template.");

  const cookie = await login();
  const timestamp = Date.now();
  const createdSlug = `listing-revision-probe-${timestamp}`;
  const originalTitle = `Listing revision probe ${timestamp}`;
  const updatedTitle = `${originalTitle} updated`;
  let createdListingId = null;

  try {
    const createPayload = {
      slug: createdSlug,
      title: originalTitle,
      status: "DRAFT",
      description: template.currentPublishedRevision.description ?? template.currentPublishedRevision.title,
      latitude: template.currentPublishedRevision.latitude,
      longitude: template.currentPublishedRevision.longitude,
      details: template.currentPublishedRevision.details,
      primaryCategoryId: template.currentPublishedRevision.primaryCategoryId,
      categoryIds: template.currentPublishedRevision.categories.map((item) => item.categoryId)
    };
    const publicPath = `/${template.currentPublishedRevision.primaryCategory.slug}/${createdSlug}`;

    const created = await fetchJson(
      "/api/listings",
      {
        method: "POST",
        body: JSON.stringify(createPayload)
      },
      cookie
    );

    assert(created.response.ok, `Could not create probe listing: ${created.data?.error ?? created.response.status}`);
    createdListingId = created.data?.data?.id ?? null;
    assert(createdListingId, "Create listing response did not include an id.");
    console.log(`Created draft listing ${createdSlug}`);

    const draftDetail = await fetch(`${BASE_URL}${publicPath}`);
    assert(draftDetail.status === 404, "Draft listing should not be publicly visible before publish.");

    const publishDraft = await fetchJson(`/api/listings/${createdListingId}/publish`, { method: "POST" }, cookie);
    assert(publishDraft.response.ok, `Could not publish draft listing: ${publishDraft.data?.error ?? publishDraft.response.status}`);

    const publishedDetail = await fetch(`${BASE_URL}${publicPath}`);
    const publishedHtml = await publishedDetail.text();
    assert(publishedDetail.ok, "Published listing should be publicly visible.");
    assert(publishedHtml.includes(originalTitle), "Published listing title did not match expected original title.");
    console.log("Published draft listing and verified public visibility");

    const saveDraft = await fetchJson(
      `/api/listings/${createdListingId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ title: updatedTitle })
      },
      cookie
    );
    assert(saveDraft.response.ok, `Could not save draft changes: ${saveDraft.data?.error ?? saveDraft.response.status}`);
    assert(saveDraft.data?.mode === "draft", "Saving a published listing should create a draft revision.");

    const stillPublishedDetail = await fetch(`${BASE_URL}${publicPath}`);
    const stillPublishedHtml = await stillPublishedDetail.text();
    assert(stillPublishedDetail.ok, "Published listing should remain visible while draft exists.");
    assert(stillPublishedHtml.includes(originalTitle), "Saving draft unexpectedly changed public title.");
    console.log("Saved draft changes without affecting the public site");

    const publishChanges = await fetchJson(`/api/listings/${createdListingId}/publish`, { method: "POST" }, cookie);
    assert(publishChanges.response.ok, `Could not publish changes: ${publishChanges.data?.error ?? publishChanges.response.status}`);

    const updatedDetail = await fetch(`${BASE_URL}${publicPath}`);
    const updatedHtml = await updatedDetail.text();
    assert(updatedDetail.ok, "Updated published listing should remain visible.");
    assert(updatedHtml.includes(updatedTitle), "Publishing draft changes did not update the public title.");
    console.log("Published draft changes and verified the public site updated");

    const archiveListing = await fetchJson(`/api/listings/${createdListingId}/archive`, { method: "POST" }, cookie);
    assert(archiveListing.response.ok, `Could not archive listing: ${archiveListing.data?.error ?? archiveListing.response.status}`);

    const archivedDetail = await fetch(`${BASE_URL}${publicPath}`);
    assert(archivedDetail.status === 404, "Archived listing should not be publicly visible.");
    console.log("Archived listing and confirmed it disappeared from the public API");

    const unarchiveListing = await fetchJson(`/api/listings/${createdListingId}/unarchive`, { method: "POST" }, cookie);
    assert(unarchiveListing.response.ok, `Could not unarchive listing: ${unarchiveListing.data?.error ?? unarchiveListing.response.status}`);

    const unarchivedDetail = await fetch(`${BASE_URL}${publicPath}`);
    const unarchivedHtml = await unarchivedDetail.text();
    assert(unarchivedDetail.ok, "Unarchived listing should be publicly visible again.");
    assert(unarchivedHtml.includes(updatedTitle), "Unarchived listing did not restore the published revision.");
    console.log("Unarchived listing and confirmed the published revision was restored");

    console.log("\nListing state workflow verification passed.");
  } finally {
    if (createdListingId) {
      await prisma.listing.delete({
        where: {
          id: createdListingId
        }
      }).catch(() => undefined);
      console.log(`Cleaned up probe listing ${createdSlug}`);
    }

    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error("Listing state workflow verification failed", error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
