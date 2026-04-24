# Porto Santo Guide

Porto Santo Guide is a directory platform for discovering where to eat and what to do across Porto Santo.

## Project Architecture

This project uses a domain-separated architecture with clear boundaries between admin and frontend:

### Directory Structure

```
src/
├── app/
│   ├── (admin)/              # Admin panel routes
│   │   ├── admin/           # /admin/* routes
│   │   ├── components/      # Admin-specific components
│   │   └── lib/            # Admin business logic
│   │
│   ├── (frontend)/          # Public frontend routes  
│   │   ├── components/      # Frontend components
│   │   ├── lib/            # Frontend logic
│   │   └── ...             # Public pages
│   │
│   └── api/                 # API routes
│
├── components/              # Shared base components (UntitledUI)
│   ├── base/              # Primitive components
│   ├── ui/                # UI wrappers
│   └── application/       # Application components
│
├── shared/                # Shared code
│   ├── components/base/   # Copy of base components
│   └── lib/               # Shared utilities
│
└── lib/                   # Shared lib (backward compat)
```

### Key Principles

- **Admin** (`src/app/(admin)/`): Self-contained admin panel, can be reused across projects
- **Frontend** (`src/app/(frontend)/`): Public site, customizable per deployment
- **Shared** (`src/shared/`, `src/lib/`): Common code used by both domains
- **Base Components** (`src/components/base/`): Reusable UI primitives (UntitledUI)

## Stack
- Next.js 16 (App Router) + TypeScript
- Prisma + PostgreSQL
- Google Maps JavaScript API for interactive maps
- Tailwind CSS v4

## Quick Start
1. Install dependencies:
   `npm install`
2. Copy environment file:
   `cp .env.example .env.local`
   and set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
3. Start local PostgreSQL:
   `docker compose up -d db`
4. Generate Prisma client:
   `npm run db:generate`
5. Create/update database tables:
   `npm run db:migrate`
6. Seed initial listings:
   `npm run db:seed`
7. Run app:
   `npm run dev`

Open `http://localhost:3000`.

## Useful Commands
- `npm run dev` - start development server
- `npm run build` - production build
- `npm run lint` - lint project
- `npm run typecheck` - TypeScript checks
- `npm run db:migrate` - create/apply local Prisma migrations
- `npm run db:migrate:deploy` - apply committed migrations
- `npm run db:push` - push schema without creating a migration
- `npm run db:studio` - open Prisma Studio
- `npm run db:seed` - insert/update sample listings
- `npm run db:import:sqlite` - import data from the legacy SQLite file into PostgreSQL

## Documentation
- `docs/architecture.md` - Detailed architecture documentation
- See `/docs` folder for more guides

## API Endpoints
- `GET /api/health` - basic health check
- `GET /api/listings` - returns listings
- `GET /api/listings?city=Lisbon&maxPrice=120` - filtered listing query
- `GET /api/search?q=porto` - global search suggestions + listing results
- `POST /api/listings` - create listing
- `GET /api/listings/:id` - get one listing
- `PATCH /api/listings/:id` - update listing
- `DELETE /api/listings/:id` - delete listing

## Editing Listings (Backend)

You can manage listings in two ways:

1. UI panel: `http://localhost:3000/admin/listings`
2. Prisma Studio: `npm run db:studio`

## Admin Authentication

Admin routes are protected with a signed HttpOnly session cookie.

Required environment variables:
- `ADMIN_SESSION_SECRET` (minimum 32 characters)

Optional environment variables:
- `ALLOWED_ORIGINS` - comma-separated allowlist for state-changing admin/API requests when accessing the app through multiple origins (example: `http://localhost:3000,http://192.168.1.50:3000`)

Login route:
- `http://localhost:3000/admin/login`

Auth model is dynamic and database-driven (`User` table) with role-based access:
- `ADMINISTRATOR`
- `OWNER`
- `SUBSCRIBER`

Seeded users (development):
- `administrator` / `admin123`
- `owner` / `owner123`
- `subscriber` / `subscriber123`

Role permissions:
- `ADMINISTRATOR`: full admin and listing management.
- `OWNER`: admin pages + can only update/delete own listings.
- `SUBSCRIBER`: authenticated but blocked from `/admin/*`.

Security hardening included:
- bcrypt password hashes in DB.
- signed JWT session cookie (`HttpOnly`, `SameSite=Strict`, secure in production).
- login rate limiting (in-memory, per IP).
- strict role checks in write endpoints.
- server-side session store with revocation on logout.
- forced session revocation after password/role/status changes.

### API payload example

```json
{
  "slug": "coimbra-hill-studio",
  "title": "Hill Studio",
  "description": "Compact studio in Coimbra old center.",
  "city": "Coimbra",
  "country": "Portugal",
  "latitude": 40.2033,
  "longitude": -8.4103,
  "pricePerNight": 92,
  "rating": 4.5
}
```

Write API authorization:
- Browser admin uses the authenticated admin session cookie.
- For programmatic access, set `ADMIN_API_KEY` and send `x-admin-key: <your_key>` in `POST`, `PATCH`, and `DELETE`.

User management endpoint (administrator only):
- `GET /api/admin/users`
- `POST /api/admin/users` with `username`, `email`, `password`, `role`

Search suggestions (administrator only):
- `GET /api/admin/search-suggestions`
- `POST /api/admin/search-suggestions`
- `PATCH /api/admin/search-suggestions/:id`
- `DELETE /api/admin/search-suggestions/:id`

## Supabase Setup

Recommended environment split:

1. One Supabase project for development
2. A separate Supabase project for production

Use these URLs in `.env.local` or your deployment environment:

- `DATABASE_URL` = Transaction pooler / pooled connection string
- `DIRECT_URL` = Direct connection string

Typical Prisma flow:

1. `npm run db:generate`
2. `npm run db:migrate` for local development
3. `npm run db:migrate:deploy` in production

## Migrating Existing SQLite Data

If you already have data in `prisma/porto-santo-guide.db`:

1. Point `DATABASE_URL` and `DIRECT_URL` to PostgreSQL
2. Apply the schema with `npm run db:migrate` or `npm run db:migrate:deploy`
3. Run `npm run db:import:sqlite`
4. Run `npm run db:verify-listing-revisions`

The import script intentionally skips `Session` and `RateLimitBucket` so the new environment starts clean.
