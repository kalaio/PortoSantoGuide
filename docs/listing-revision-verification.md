# Listing Revision Verification

Use this checklist after touching the listing state / revision workflow.

## Automated Checks

Run in this order:

```bash
npm run db:generate
npm run db:migrate
npm run db:backfill-listing-revisions
npm run db:verify-listing-revisions
npm run verify:listing-states # requires local app server
npm run build
npm run typecheck
npm run lint
```

Why this order:

- `build` generates `.next/types`, which this repo includes in `tsconfig.json`
- `db:verify-listing-revisions` checks the live DB invariants for published/draft pointers

## What `db:verify-listing-revisions` checks

- `PUBLISHED` and `ARCHIVED` listings have `currentPublishedRevisionId`
- `DRAFT` listings have `currentDraftRevisionId`
- published revision pointers resolve and belong to the same listing
- draft revision pointers resolve and belong to the same listing
- published revisions have status `PUBLISHED`
- draft revisions have status `DRAFT`
- revision category assignments include the primary category
- published and draft pointers do not point to the same revision

Warnings are reported separately so we can inspect suspicious-but-legal states.

## End-to-End Workflow Probe

Run the app locally, then execute:

```bash
npx next start -p 3010
npm run verify:listing-states
```

The probe script:

- logs in as the seeded administrator
- creates a temporary draft listing using a valid published listing as template data
- verifies draft invisibility in the public API
- publishes it and verifies public visibility
- saves draft changes to a published listing and confirms the public API stays unchanged
- publishes the draft changes and confirms the public API updates
- archives and unarchives the listing and confirms public visibility toggles correctly
- deletes the temporary probe listing at the end

## Manual Regression Matrix

### 1. Create / Publish

- create a new listing as `DRAFT`
- confirm it appears in admin only
- publish it
- confirm it appears in:
  - `/where-to-eat` or `/what-to-do`
  - category page
  - detail page
  - `/api/listings`
  - `/api/search`

### 2. Published Listing With Draft Changes

- open a published listing
- change slug/title/details/category
- click `Save draft`
- confirm:
  - admin shows `Draft changes`
  - public pages still show the old published version
  - search/menu still use the old published version

### 3. Publish Changes

- click `Publish changes`
- confirm:
  - new slug is now public
  - old slug no longer resolves publicly
  - search results update
  - category/menu placement updates

### 4. Discard Draft

- create a draft for a published listing
- click `Discard draft`
- confirm admin returns to the published snapshot

### 5. Archive / Unarchive

- archive a published listing
- confirm it disappears from:
  - public category page
  - detail page
  - menu
  - search
- unarchive it
- confirm it returns publicly

### 6. Taxonomy Edge Cases

- publish a listing, then deactivate its category or section
- verify public pages, search, and menu remain consistent
- ensure no orphan public route leaks through API/search

### 7. Permissions

- verify `OWNER` can only edit owned listings
- verify `SUBSCRIBER` cannot access listing admin routes/APIs

## Performance Watchpoints

Review these code paths whenever the listing dataset grows:

- `src/lib/listings.ts`
  - `getFeaturedListings`
  - `getPublicMenuLinks`
  - `getListingsByCategorySlug`
  - `getListingByCategoryAndSlug`
- `src/app/api/search/route.ts`
- `src/lib/admin-listings.ts`

Specific concerns:

- text `contains` search in public search
- full-table admin listing loads with revision/category/schema joins
- repeated `deleteMany` + `createMany` on publish/update joins

## Approval Criteria

- no public route returns `DRAFT` or `ARCHIVED` content
- saving a draft for a published listing never changes the public site
- publish/discard/archive/unarchive always leave valid revision pointers
- automated checks and build/type/lint all pass
