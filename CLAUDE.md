# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- Frontend: React 18 + Vite + TypeScript + Tailwind, single SPA in [src/App.tsx](src/App.tsx) (~2.5k lines).
- Backend: Fastify 5 + `@fastify/jwt` + `@fastify/multipart` + `sharp` for image processing.
- Database: PostgreSQL via Docker, accessed through Prisma 7 with the `@prisma/adapter-pg` driver adapter ([backend/src/db.ts](backend/src/db.ts)).
- Validation: `zod` everywhere — request bodies and `env`.

## Commands

```bash
# Local dev (run in two terminals)
docker compose up -d postgres        # only Postgres; api container is for prod
npm run dev                          # Vite at :5173
npm run dev:api                      # Fastify (tsx watch) at :3333

# Database
npm run prisma:generate              # regenerate client into backend/generated/prisma
npm run prisma:migrate               # create+apply migration locally (prisma migrate dev)
npm run prisma:studio
npm run seed:admin                   # creates the platform admin from PLATFORM_ADMIN_* env
npm run seed:legacy-menu             # imports the legacy supabase catalog into a tenant

# Build
npm run build:api                    # prisma generate + tsc backend
npm run build                        # build:api + vite build (writes to dist/)
npm run start:api                    # production API (tsx)
npm run preview                      # serve built frontend
```

There is no test runner configured — `npm test` does not exist. If asked to add tests, confirm framework choice first.

## Architecture

### One SPA, two surfaces, multi-tenant routing

[src/App.tsx](src/App.tsx) renders **both** the admin panel and the public customer-facing menu from the same bundle. Which one shows is decided at runtime by `getTenantFromLocation()` and `isPanelHost()` near the top of the file:

- `app.<root>` / `admin.<root>` / `localhost` → admin panel (login, platform admin, establishment workspace).
- `<slug>.<root>` or `?tenant=<slug>` query param → public menu for that establishment.
- Reserved subdomains: `app`, `admin`, `www`.

Root domain detection special-cases `.com.br` to keep three labels (`foo.umenu.com.br`). When changing host/routing logic, update `getRootDomain`, `getTenantFromLocation`, `isPanelHost`, `panelUrl`, and `publicUrlFor` together.

### Backend route groups ([backend/src/server.ts](backend/src/server.ts))

All routes live in this single ~900-line file. Three groups:

- **Public, no auth** — `/api/public/menu/:subdomain`, `/api/public/menu/:subdomain/visit`, `/api/public/menu/:subdomain/orders`, `/api/public/subdomains/:subdomain/availability`. These are how the customer-facing SPA loads catalogs and reports analytics.
- **Auth** — `/api/auth/login`, `/api/auth/me`. JWT issued by Fastify carries `{ sub, role, establishmentIds }` (see [backend/src/auth.ts](backend/src/auth.ts)); `establishmentIds` is loaded from `establishment_users` at login time and is the basis for tenant authorization.
- **Admin, JWT-protected** — `/api/admin/*`. Two preHandler guards:
  - `requirePlatformAdmin` — only `PLATFORM_ADMIN` role.
  - `requireAdminAccessToEstablishment` — platform admins pass; tenant admins must have the `establishmentId` URL param in `request.user.establishmentIds`.

When adding admin routes, pick the right guard based on whether the operation is platform-wide or scoped to one tenant.

### CORS allows wildcard subdomains

[backend/src/server.ts:32-63](backend/src/server.ts#L32-L63) reads `APP_DOMAIN` and accepts any `*.<APP_DOMAIN>` origin in addition to the explicit `CORS_ORIGIN` list. This is what lets per-tenant subdomains call the API. Don't replace it with a static allowlist.

### Prisma client lives outside `node_modules`

[prisma/schema.prisma](prisma/schema.prisma) sets `output = "../backend/generated/prisma"`. Imports use relative paths from `backend/src/*`:

```ts
import { PrismaClient } from "../generated/prisma/client";
import { UserRole, PricingType } from "../generated/prisma/enums";
```

After schema edits, run `npm run prisma:generate` (also part of `build:api`) — without it, types in `backend/generated/prisma/` go stale and `tsc` fails.

[prisma.config.ts](prisma.config.ts) is the Prisma 7 config; it loads `dotenv/config` and is what `prisma migrate` reads. The generator block in [schema.prisma](prisma/schema.prisma) intentionally has no `url` because the config supplies it.

### Image pipeline

Uploads go through [backend/src/services/images.ts](backend/src/services/images.ts):

- Multipart upload (`@fastify/multipart`, single file, size capped by `MAX_UPLOAD_MB`).
- `sharp` re-encodes to WebP with per-scope sizing (`product`, `logo`, `banner`, `ai`) and strips metadata.
- Files stored at `<UPLOAD_DIR>/establishments/<id>/<scope>/<slug>-<ts>-<uuid>.webp`.
- Served via `@fastify/static` at `/uploads/`.
- Public URLs are built by joining `PUBLIC_UPLOAD_BASE_URL` + the relative path. In prod this must point at the API host.

The optional AI image enhancement (`/api/admin/products/:productId/image/enhance`) consumes one credit from `Establishment.aiImageCredits` per success and refunds on failure — this credit accounting must stay atomic if you touch that endpoint.

### Domain model ([prisma/schema.prisma](prisma/schema.prisma))

Tenant = `Establishment`. Membership is many-to-many through `EstablishmentUser`. `Category` and `Product` are scoped to an establishment with `@@unique([establishmentId, slug])`. `Order` stores cart items as JSON (the order is finalized in WhatsApp; we only record what was sent). `MenuVisit` tracks public-menu hits for analytics.

## Two TypeScript projects

- [tsconfig.json](tsconfig.json) — frontend, `noEmit`, only `src/main.tsx` and `src/vite-env.d.ts` are compiled (Vite handles the rest).
- [backend/tsconfig.json](backend/tsconfig.json) — backend, also `noEmit` but used by the build script for type-checking. `tsx` runs the TS directly at runtime.

If you add backend files, they must live under `backend/src/**` to be type-checked. Seeds are excluded.

## What NOT to touch

- [legacy/supabase-version/](legacy/) is the pre-migration codebase kept for reference only. It is not built or deployed.
- [backend/generated/prisma/](backend/generated/prisma/) is generated — never hand-edit; re-run `prisma:generate`.

## Stale docs warning

[GUIA_DESENVOLVIMENTO.md](GUIA_DESENVOLVIMENTO.md), [SETUP_DATABASE.md](SETUP_DATABASE.md), and [REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md) were written during the Supabase era and reference `umenu_*` tables, RLS, Edge Functions, and `useTenant` hooks that no longer exist. The current authoritative sources are [README.md](README.md), [APLICACAO_OVERVIEW.md](APLICACAO_OVERVIEW.md), [DEPLOYMENT.md](DEPLOYMENT.md), and the Prisma schema. Don't infer behavior from the Supabase docs.

## Environment

`backend/src/env.ts` parses env with zod and rejects startup on missing/invalid values. `JWT_SECRET` requires ≥32 chars. `PUBLIC_UPLOAD_BASE_URL` must be a valid URL when set. See [README.md](README.md) and [DEPLOYMENT.md](DEPLOYMENT.md) for the full variable list.

The Docker image ([backend/Dockerfile](backend/Dockerfile)) runs `prisma migrate deploy` then `npm run start:api` via the compose `command:` (see [docker-compose.yml](docker-compose.yml#L62)).
