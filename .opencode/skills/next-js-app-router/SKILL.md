---
name: next-js-app-router
description: Best practices for Next.js 16 App Router with Server Components, API routes, and data fetching patterns
license: MIT
compatibility: opencode
metadata:
  framework: Next.js
  version: "16.x"
  router: App Router
---

## What This Skill Covers

Next.js 16 App Router patterns and conventions for the PortoSantoGuide project.

## Server Components (Default)

- All components are Server Components by default
- Fetch data directly in components using async/await
- Access cookies, headers, and searchParams directly
- Use `cache()` for request deduplication

```tsx
// Server Component - can be async
async function ListingPage({ params }: { params: { id: string } }) {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id }
  });
  
  return <div>{listing?.name}</div>;
}
```

## Client Components

Only when you need:
- Browser APIs (window, document)
- React hooks (useState, useEffect, useContext)
- Event handlers (onClick, onSubmit)
- Client-side interactivity

```tsx
'use client';

import { useState } from 'react';

export function SearchInput() {
  const [query, setQuery] = useState('');
  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

## API Routes

Use Route Handlers in `app/api/`:

```ts
// app/api/listings/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const listings = await prisma.listing.findMany();
  return NextResponse.json(listings);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // Validate with Zod
  const listing = await prisma.listing.create({ data: body });
  return NextResponse.json(listing, { status: 201 });
}
```

## Data Fetching Patterns

1. **Server Components**: Fetch directly
2. **Parallel fetching**: Use Promise.all()
3. **Cached requests**: Use React `cache()`
4. **Revalidation**: Use `revalidatePath()` or `revalidateTag()`

```tsx
import { cache } from 'react';

const getListing = cache(async (id: string) => {
  return prisma.listing.findUnique({ where: { id } });
});
```

## Routing Conventions

- `page.tsx` - Route segment UI
- `layout.tsx` - Shared UI wrapper
- `loading.tsx` - Loading UI (automatic)
- `error.tsx` - Error handling
- `not-found.tsx` - 404 page
- `route.ts` - API endpoint

## When to Use

Use this skill when:
- Creating new pages or API routes
- Deciding between Server and Client Components
- Implementing data fetching patterns
- Working with dynamic routes and params
