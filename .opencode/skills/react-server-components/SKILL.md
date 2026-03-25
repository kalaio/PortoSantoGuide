---
name: react-server-components
description: Guidelines for React Server Components vs Client Components decision making and patterns
license: MIT
compatibility: opencode
metadata:
  react: "19.x"
  pattern: Server Components
---

## What This Skill Covers

When and how to use React Server Components vs Client Components in Next.js.

## Rule of Thumb

**Start with Server Components** - only use Client Components when necessary.

## Server Components (Default)

### Can Do:
- Fetch data directly (async components)
- Access backend resources (database, filesystem)
- Keep sensitive data on server
- Reduce client-side JavaScript

### Cannot Do:
- Use browser APIs (window, document, localStorage)
- Use React hooks (useState, useEffect, useContext)
- Add event listeners (onClick, onSubmit)
- Access browser-only libraries

```tsx
// Server Component - good for data fetching
async function ListingCard({ id }: { id: string }) {
  const listing = await prisma.listing.findUnique({ where: { id } });
  
  return (
    <div>
      <h2>{listing?.name}</h2>
      <p>{listing?.description}</p>
    </div>
  );
}
```

## Client Components

Use `'use client'` directive at the top.

### When to Use:
- Browser interactivity
- React hooks (state, effects, refs)
- Event handlers
- Browser APIs
- Client-side libraries (MapLibre on client)

```tsx
'use client';

import { useState } from 'react';
import Map from './Map';

export function ListingMap({ coordinates }: { coordinates: [number, number] }) {
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  
  return (
    <Map 
      coordinates={coordinates}
      onMarkerClick={setSelectedMarker}
    />
  );
}
```

## Component Composition Pattern

Keep data fetching in Server Components, pass to Client Components:

```tsx
// page.tsx (Server Component)
export default async function ListingPage({ params }: { params: { id: string } }) {
  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  
  return (
    <div>
      <ListingDetails listing={listing} />
      <ListingMapClient coordinates={listing?.coordinates} />
    </div>
  );
}

// ListingMapClient.tsx (Client Component)
'use client';

export function ListingMapClient({ coordinates }: { coordinates?: [number, number] }) {
  // Client-side map rendering
  return <div id="map">...</div>;
}
```

## Common Patterns

### Form Handling
```tsx
// Server Action (Server)
async function createListing(formData: FormData) {
  'use server';
  // Server-side validation and creation
}

// Page (Server Component)
export default function NewListingPage() {
  return (
    <form action={createListing}>
      <input name="title" />
      <SubmitButton />
    </form>
  );
}

// SubmitButton (Client Component)
'use client';

export function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>Create</button>;
}
```

## When to Use

Use this skill when:
- Deciding between Server and Client Components
- Architecting component hierarchies
- Implementing forms with Server Actions
- Handling data fetching vs interactivity
