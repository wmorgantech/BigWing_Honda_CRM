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

## Local IIS Deployment

1. Install IIS with Static Content, plus the IIS URL Rewrite and Application
   Request Routing (ARR) modules. Enable ARR proxying at the server level.
2. Set `backend/.env` for production: `NODE_ENV=production`, `PORT=3005`, the
   remote PostgreSQL `DATABASE_URL`, and unique `JWT_SECRET` and
    `JWT_REFRESH_SECRET` values of at least 32 characters. Set `CORS_ORIGIN` to
    the site's origin (for example, `https://crm.example.com`). Keep secrets
    out of source control. Set `REDIS_URL` if Redis is used.
3. Set the same `DATABASE_URL` in `backend/db/.env` for Prisma commands. Check
   migration status before any deployment migration; do not run migrations
   without approval and a database backup.
4. From the project root run `npm run build`. This writes the frontend to
   `frontend/dist` and the API to `backend/dist`. Production frontend requests
   use the same-origin `/api/v1` path.
5. Run `node dist/server.js` as a Windows service with its working directory
   set to `backend`. Keep port 3005 restricted to local machine traffic.
6. Create an IIS site whose physical path is `frontend/dist`. The included
   `web.config` proxies `/api/*` and `/uploads/*` to `127.0.0.1:3005`, allows
   request bodies up to 100 MiB, and falls back to `index.html` for SPA routes.
   Bind the site to the desired hostname and HTTPS certificate.
7. Verify the API directly at `http://127.0.0.1:3005/api/health`, then verify
   it through IIS at `https://<your-hostname>/api/health`.

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

## Default Credentials

- **SuperAdmin:** admin@bigwing.in / BigWing@2026

## API Endpoints (M1)

- `POST /api/v1/auth/login` — Login
- `POST /api/v1/auth/refresh` — Refresh token
- `POST /api/v1/auth/logout` — Logout
- `GET /api/v1/users` — List users (Admin+)
- `POST /api/v1/users` — Create user (Admin+)
- `PATCH /api/v1/users/:id` — Update user (Admin+)
- `GET /api/docs` — Interactive API documentation
