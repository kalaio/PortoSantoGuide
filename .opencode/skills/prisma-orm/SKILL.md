---
name: prisma-orm
description: Prisma ORM best practices for database operations, schema design, and query optimization
license: MIT
compatibility: opencode
metadata:
  orm: Prisma
  version: "6.x"
  database: SQLite (dev) / PostgreSQL (prod)
---

## What This Skill Covers

Prisma ORM patterns and best practices for the PortoSantoGuide project.

## Schema Design

Location: `prisma/schema.prisma`

### Naming Conventions
- Models: PascalCase (singular) - `User`, `Listing`
- Fields: camelCase - `firstName`, `createdAt`
- Enums: PascalCase - `UserRole`, `ListingStatus`

### Relations

```prisma
model Listing {
  id          String   @id @default(uuid())
  owner       User     @relation(fields: [ownerId], references: [id])
  ownerId     String
  category    Category @relation(fields: [categoryId], references: [id])
  categoryId  String
}
```

### Enums for Status

```prisma
enum ListingStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  REJECTED
  ARCHIVED
}
```

## Query Patterns

### Basic CRUD

```ts
// Create
const listing = await prisma.listing.create({
  data: { name: 'Beach House', ownerId: userId }
});

// Read
const listing = await prisma.listing.findUnique({
  where: { id }
});

// Update
const updated = await prisma.listing.update({
  where: { id },
  data: { name: 'Updated Name' }
});

// Delete
await prisma.listing.delete({ where: { id } });
```

### Include Relations

```ts
const listing = await prisma.listing.findUnique({
  where: { id },
  include: {
    owner: true,
    category: true,
    reviews: { take: 5 }
  }
});
```

### Select Specific Fields

```ts
const listings = await prisma.listing.findMany({
  select: {
    id: true,
    name: true,
    price: true,
    owner: { select: { name: true } }
  }
});
```

### Pagination

```ts
const listings = await prisma.listing.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' }
});
```

## Transactions

```ts
const result = await prisma.$transaction(async (tx) => {
  const listing = await tx.listing.create({ data: { ... } });
  await tx.listingRevision.create({
    data: { listingId: listing.id, action: 'CREATED' }
  });
  return listing;
});
```

## Avoiding N+1 Queries

**Bad** (N+1 problem):
```ts
const listings = await prisma.listing.findMany();
for (const listing of listings) {
  const owner = await prisma.user.findUnique({ where: { id: listing.ownerId } });
  // N additional queries!
}
```

**Good** (single query):
```ts
const listings = await prisma.listing.findMany({
  include: { owner: true }
});
```

## Migrations

```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Seed database
npm run db:seed
```

## When to Use

Use this skill when:
- Designing or modifying the database schema
- Writing Prisma queries
- Optimizing database performance
- Working with relations and transactions
