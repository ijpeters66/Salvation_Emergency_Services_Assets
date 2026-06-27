# Salvation Army Emergency Services Asset Register

Custom offline-capable asset, consumables, deployment, maintenance, QR, attachment, audit, and reporting application for Salvation Army Emergency Services Victoria.

## What this app does

- manages operational locations
- tracks individual assets and parent/child assignments
- tracks consumables by batch with FIFO issue history
- records deployments and assigned stock/assets
- records maintenance schedules, maintenance records, and approved vendors
- supports QR label generation and scan resolution
- supports document and photo attachments
- keeps an audit trail for important changes
- supports offline queueing and sync
- exports CSV, XLSX, and PDF reports

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, and Storage
- IndexedDB for offline queue and optimistic state
- Vitest for unit/integration-style tests
- Playwright for browser smoke coverage

## Local development

Install dependencies:

```bash
npm install
```

Copy environment values:

```bash
cp .env.example .env.local
```

Required env vars:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Start the app:

```bash
npm run dev
```

## Quality commands

```bash
npm run lint
npm test
npm run build
```

Production smoke check:

```bash
SMOKE_BASE_URL=https://your-app.vercel.app npm run smoke:prod
```

## QA/admin user setup

Create or refresh a QA user after migrations:

```bash
npm run qa:create-user -- --email qa@example.com --password "ChangeMe123!" --name "QA Admin" --role system_admin
```

## Database

Migrations live in:

- `supabase/migrations/`

Development seed data lives in:

- `supabase/seeds/dev_seed.sql`

Run the seed only after:

1. migrations are applied
2. at least one user profile exists

## Preview workflows

The app includes preview-mode workflow routes for smoke testing and demos without live operational data:

- `/dashboard?preview=1`
- `/assets?preview=1`
- `/consumables?preview=1`
- `/deployments?preview=1`
- `/locations?preview=1`
- `/maintenance?preview=1`
- `/audit?preview=1`
- `/reports?preview=1&reportId=asset-register`
- `/scan?preview=1`

These routes are useful for:

- client walkthroughs
- browser smoke tests
- demo flows when a disposable Supabase environment is not available

## Docs

- [Deployment guide](docs/deployment-vercel-supabase.md)
- [Operations and security](docs/operations-and-security.md)
- [Specification](SPECIFICATION.md)
- [Build prompts](PROMPT.md)
- [Working checklist](todo.md)

## Current production-readiness notes

- security headers are configured in `next.config.ts`
- route-level loading and error boundaries are in place for major modules
- global error handling exists in `src/app/global-error.tsx`
- offline sync failures emit observability events and structured logs
- preview workflow routes cover the major operational modules for smoke testing

## Verification status

Latest local verification completed:

- `npm run lint`
- `npm test`
- `npm run build`

Browser E2E coverage exists under `tests/e2e/`, including the preview workflow hardening suite. Running those tests in this Codex environment may still be blocked by local port restrictions, so they are intended to be run on the developer machine or deployed environment.
