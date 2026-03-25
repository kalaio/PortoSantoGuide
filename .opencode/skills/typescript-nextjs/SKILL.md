---
name: typescript-nextjs
description: TypeScript patterns and types for Next.js 16, React 19, and API routes
license: MIT
compatibility: opencode
metadata:
  language: TypeScript
  version: "5.x"
  target: Next.js
---

## What This Skill Covers

TypeScript patterns specific to Next.js 16 and React 19 for the PortoSantoGuide project.

## Page Types

### Dynamic Route Pages
```tsx
// app/listings/[id]/page.tsx
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ListingPage({ params }: PageProps) {
  const { id } = await params;
  // ...
}
```

### Layout Types
```tsx
// app/layout.tsx
interface LayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
  return <html>{children}</html>;
}
```

## API Route Types

```ts
// app/api/listings/route.ts
import { NextRequest, NextResponse } from 'next/server';

// For Request type
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  
  return NextResponse.json({ data: [] });
}

// For typed responses
interface ListingResponse {
  id: string;
  name: string;
  price: number;
}

export async function POST(request: NextRequest) {
  const body: CreateListingInput = await request.json();
  // ...
  return NextResponse.json<ListingResponse>(listing, { status: 201 });
}
```

## Component Props

```tsx
interface ListingCardProps {
  listing: {
    id: string;
    name: string;
    description?: string;
    price: number;
    images: string[];
  };
  onSelect?: (id: string) => void;
  isSelected?: boolean;
}

export function ListingCard({ listing, onSelect, isSelected }: ListingCardProps) {
  // ...
}
```

## React 19 Types

### Server Actions
```tsx
'use server';

import { z } from 'zod';

const createListingSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
});

type CreateListingInput = z.infer<typeof createListingSchema>;

export async function createListing(formData: FormData) {
  const rawData = Object.fromEntries(formData);
  const validated = createListingSchema.parse(rawData);
  // ...
}
```

### Form Actions
```tsx
'use client';

import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>Submit</button>;
}
```

### use() Hook
```tsx
import { use } from 'react';

function Comments({ commentsPromise }: { commentsPromise: Promise<Comment[]> }) {
  const comments = use(commentsPromise);
  return <ul>{comments.map(c => <li key={c.id}>{c.text}</li>)}</ul>;
}
```

## Utility Types

### Nullable Fields
```ts
type Nullable<T> = T | null;
type Optional<T> = T | undefined;
```

### API Response Types
```ts
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

interface ApiError {
  error: string;
  code: string;
  details?: Record<string, string[]>;
}
```

### Form Types
```ts
type FormState<T> = 
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; data: T }
  | { status: 'error'; errors: Record<string, string[]> };
```

## Type Guards

```ts
function isListing(obj: unknown): obj is Listing {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj
  );
}
```

## When to Use

Use this skill when:
- Defining types for Next.js routes and components
- Creating API route handlers
- Working with React 19 new features (use, form actions)
- Building reusable component prop interfaces
