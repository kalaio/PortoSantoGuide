# AGENTS.md
Agent playbook for this repository (Next.js + TypeScript + Prisma).

## Mission-Critical Rule
- Treat this as imperative in any prompt: ship secure, performant, tested changes with no known regressions.
- Do not stop at "works on my machine"; verify behavior, types, lint, and build before finalizing.

## Instruction Priority
1. Direct user request for the current task.
2. This `AGENTS.md`.
3. Repo-local agent rules (`.cursor/rules`, `.cursorrules`, `.github/copilot-instructions.md`) when present.
4. Enforced tooling rules (TypeScript, ESLint, Prisma, test runner, build).
5. Framework defaults and best practices.

If two rules conflict, follow the highest-priority rule and mention the tradeoff.

## Current Stack
- Framework: Next.js (App Router)
- Language: TypeScript
- DB: Prisma ORM (SQLite in local dev, Postgres-ready via `DATABASE_URL`)
- Map: Google Maps JavaScript API
- Auth: DB-backed users + role-based sessions (`ADMINISTRATOR`, `OWNER`, `SUBSCRIBER`)

## Required Commands
Use npm scripts first.

- Install deps: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Type-check: `npm run typecheck`
- DB generate client: `npm run db:generate`
- DB schema push: `npm run db:migrate`
- Seed data: `npm run db:seed`
- Prisma Studio: `npm run db:studio`

## Test Commands (Present and Future)
There is no dedicated test runner configured yet. Until one is added:
- Always run: `npm run typecheck && npm run lint && npm run build`

When adding tests, use these conventions:
- Unit/integration (recommended): Vitest + Testing Library
  - All tests: `npx vitest run`
  - Single file: `npx vitest run src/path/file.test.ts`
  - Single test: `npx vitest run src/path/file.test.ts -t "test name"`
- E2E (recommended): Playwright
  - All tests: `npx playwright test`
  - Single spec: `npx playwright test tests/search.spec.ts`

## Non-Negotiable Delivery Gate
Before completing any non-trivial change, agents must do all applicable checks:
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Run targeted tests for touched behavior (once test runner exists)

If something cannot be run, state exactly what was skipped and why.

## Next.js Engineering Best Practices
- Prefer Server Components; use Client Components only when interactivity/browser APIs are required.
- Keep data fetching on the server whenever possible.
- Keep API routes thin: validate input, authorize, delegate DB logic, return structured errors.
- Avoid unnecessary client waterfalls (`useEffect` fetch) for initial page data.
- Use route-level loading/error states for smoother UX where relevant.
- Keep shared UI state local and explicit; avoid hidden global coupling.
- Do not break App Router conventions (`app/` routes, server/client boundaries).

## Code Style and Architecture
- Imports: stdlib/third-party/internal grouped and sorted.
- Types: explicit public API types; avoid `any` unless isolated and justified.
- Naming:
  - Components/types: `PascalCase`
  - Variables/functions: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
- Prefer small composable functions over large mixed-responsibility blocks.
- Keep diffs focused; avoid unrelated refactors.

## API and Validation Rules
- Validate all external input with Zod.
- Return consistent JSON error shape with actionable message.
- Use correct status codes (`400`, `401`, `403`, `404`, `409`, `429`, `500`).
- Never trust client role assertions; enforce permissions server-side.
- Prevent overfetching and unbounded queries (always cap results).

## Auth and Authorization Rules
- Session cookies must be `HttpOnly`, `SameSite=Strict`, `Secure` in production.
- Session tokens must be signed and revocable server-side.
- Revoke active sessions after sensitive account updates (password, role, deactivation).
- Apply role checks on every write path.
- `SUBSCRIBER` must not access admin tools.
- `OWNER` can only manage owned resources.
- `ADMINISTRATOR` has full admin capabilities.

## Security Requirements
- Never commit secrets or raw credentials.
- Keep `.env.example` as placeholders only.
- Sanitize and validate all user-supplied values.
- Avoid leaking internals in error messages.
- Do not log secrets, auth tokens, or PII.
- Rate-limit authentication and abuse-prone endpoints.
- Use least privilege for roles and API keys.

## Performance Requirements
- Avoid re-render churn and request races in client search/autocomplete.
- Debounce high-frequency search requests.
- Avoid visual flicker/blink on dropdown/state transitions.
- Keep API payloads minimal (select only needed fields).
- Prevent N+1 patterns in Prisma queries.
- Use appropriate ordering and limits for lists.

## Search UX Rules (Current Product)
- One global search input in public header.
- On focus with empty input: show suggestions only.
- On typed query or suggestion click: show results only.
- Clearing input returns to full suggestions list.
- Clicking a result navigates to listing detail route.

## Database and Prisma Practices
- Keep schema and seed aligned with runtime assumptions.
- After schema updates: run `npm run db:migrate` and `npm run db:generate`.
- Seed should be idempotent (`upsert` where possible).
- For destructive schema changes, document migration impact.

## UI Quality Rules
- Preserve current visual language and spacing rhythm.
- Ensure responsive behavior on desktop and mobile.
- Avoid blocking user input during async refresh when stale data can remain visible.
- Prefer accessible controls (labels, button semantics, focus handling).

## Bug Prevention Checklist
- Reproduce issue first.
- Implement smallest reliable fix.
- Add/adjust tests when test framework exists.
- Verify edge cases (empty, invalid, unauthorized, race conditions).
- Re-run required checks before final response.

## Cursor/Copilot Integration Status
- No `.cursor/rules`, `.cursorrules`, or `.github/copilot-instructions.md` found currently.
- If added later, merge relevant constraints here and apply priority rules.

## Maintenance
- Keep this file strict and practical.
- Update command section when scripts change.
- Update auth/security section when role/session model changes.
- Keep these standards enforceable for all future prompts.
