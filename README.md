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
- Prisma + SQLite (default local dev)
- Google Maps JavaScript API for interactive maps
- Tailwind CSS v4

## Quick Start
1. Install dependencies:
   `npm install`
2. Copy environment file:
   `cp .env.example .env.local`
   and set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
3. Generate Prisma client:
   `npm run db:generate`
4. Create/update database tables:
   `npm run db:migrate`
5. Seed initial listings:
   `npm run db:seed`
6. Run app:
   `npm run dev`

Open `http://localhost:3000`.

## Useful Commands
- `npm run dev` - start development server
- `npm run build` - production build
- `npm run lint` - lint project
- `npm run typecheck` - TypeScript checks
- `npm run db:migrate` - sync Prisma schema to local DB
- `npm run db:studio` - open Prisma Studio
- `npm run db:seed` - insert/update sample listings

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

## Alternative Database (Recommended for production)

If you want managed cloud DB, use Supabase or Neon (PostgreSQL).

1. Create a project in Supabase/Neon.
2. Copy the pooled connection string.
3. Set in `.env.local`:
   `DATABASE_URL="postgresql://..."`
4. Run:
   `npm run db:generate && npm run db:migrate && npm run db:seed`

Note: SQLite is used by default for zero-setup local development.
