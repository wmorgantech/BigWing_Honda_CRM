# Bigwing CRM

Honda two-wheeler premium dealership CRM — Bangalore.

## Tech Stack

- **Backend:** Node.js 20 + Express 4 + TypeScript
- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Database:** PostgreSQL 15 (schemas: `auth`, `core`, `master`, `app`)
- **ORM:** Prisma
- **Queue:** BullMQ + Redis
- **API Docs:** Scalar (served at `/api/docs`)

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment file
cp .env.example .env
# Edit .env with your database credentials

# 3. Create PostgreSQL schemas
psql -U bigwing -d bigwing_crm -c "CREATE SCHEMA IF NOT EXISTS auth; CREATE SCHEMA IF NOT EXISTS core; CREATE SCHEMA IF NOT EXISTS master; CREATE SCHEMA IF NOT EXISTS app;"

# 4. Run migrations
pnpm db:migrate

# 5. Seed initial data (roles, admin, lookups)
pnpm db:seed

# 6. Start development
pnpm dev
```

## IIS Deployment Checklist

The repository does not contain the production DNS records or IIS site bindings.
Before deployment, record and verify the existing BigWing and RedWing hostnames
and site names; do not substitute the example hostnames from older notes.

| Brand/site | Existing IIS site name | Existing HTTPS hostname |
| --- | --- | --- |
| BigWing | Verify on the IIS host | Verify DNS and IIS binding |
| RedWing | Verify on the IIS host | Verify DNS and IIS binding |

### Host and application

- [ ] Confirm the hostnames above resolve to the production IIS host and that
  each existing IIS site has an HTTPS binding and valid certificate.
- [ ] Install IIS Static Content, URL Rewrite, and Application Request Routing
  (ARR); enable ARR proxying at the server level.
- [ ] Build from the project root with `npm run build`. The production frontend
  build sets `VITE_API_URL=/api/v1`; its built bundle must not contain a direct
  external HTTP API fallback.
- [ ] Point each IIS site's physical path to `frontend/dist`. The included
  rewrite rules serve SPA routes and proxy `/api/*` and `/uploads/*` to
  `127.0.0.1:3005`. Confirm the production backend listens only on loopback or
  is otherwise firewalled from public access.
- [ ] Run `node dist/server.js` as a Windows service with working directory
  `backend` and `NODE_ENV=production`.
- [ ] Set `PORT=3005`, `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`,
  `CORS_ORIGIN`, and `UPLOADS_DIR` in the service environment. The database URL
  is required; JWT secrets must each be at least 32 characters. Set the
  `CORS_ORIGIN` to the exact browser origin if requests are cross-origin; with
  same-origin IIS proxying, browser API calls remain on each site's origin.
  Optional validated settings are `JWT_EXPIRES_IN`,
  `JWT_REFRESH_EXPIRES_IN`, `REDIS_URL`, `RATE_LIMIT_WINDOW_MS`, and
  `RATE_LIMIT_MAX`. Never put production values in source control.
- [ ] Set `UPLOADS_DIR` to a persistent absolute directory outside replaceable
  release folders. Grant the backend service identity read/write access there;
  grant IIS read access only to the `avatars` subdirectory. Import spreadsheets
  are stored under `private/imports` and must not be exposed as static files.
  Plan backups, retention, and disk-space monitoring.
- [ ] Confirm PostgreSQL is reachable from the backend host, the production
  database and least-privilege account exist, TLS/network access is configured,
  and a tested backup is available. The repository currently has no Prisma
  migration history; resolve schema deployment separately before any database
  changes.
- [ ] Verify `http://127.0.0.1:3005/api/health` on the host and then
  `https://<verified-existing-hostname>/api/health` through each IIS site.
  Test login, authenticated APIs, avatar delivery, and denial of unauthenticated
  and cross-brand import-file downloads.

No production IIS host, hostname, certificate, ARR configuration, service
identity, or PostgreSQL connection has been verified by this local checklist.

## Project Structure

```
BigwingCRM/
├── apps/
│   ├── api/          # Express + TS backend
│   └── web/          # React + TS frontend (coming in M2)
├── packages/
│   ├── shared/       # Shared Zod schemas, enums, types
│   └── db/           # Prisma schema, migrations, seed
├── infra/            # Docker, nginx, CI/CD configs
└── pnpm-workspace.yaml
```

## Seed Account Passwords

Before running the main seed, set `SEED_ADMIN_PASSWORD` and
`SEED_TELECALLER_PASSWORD` in `backend/.env` or the process environment. The
seed uses those passwords only when creating the corresponding users; it does
not reset existing users. The senior developer script requires
`SENIOR_DEVELOPER_PASSWORD`; the Redwing script requires
`REDWING_ADMIN_PASSWORD` only when creating that user. Set unique passwords
through a local secret store; scripts fail if a required password is missing.
See `backend/.env.example` for the variable names.

## API Endpoints (M1)

- `POST /api/v1/auth/login` — Login
- `POST /api/v1/auth/refresh` — Refresh token
- `POST /api/v1/auth/logout` — Logout
- `GET /api/v1/users` — List users (Admin+)
- `POST /api/v1/users` — Create user (Admin+)
- `PATCH /api/v1/users/:id` — Update user (Admin+)
- `GET /api/docs` — Interactive API documentation
