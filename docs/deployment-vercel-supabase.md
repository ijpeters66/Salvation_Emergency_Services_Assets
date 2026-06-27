# Deployment Guide

## Target stack

- Frontend/runtime: Vercel
- Database/auth/storage: Supabase

## 1. Create and configure Supabase

1. Create a Supabase project.
2. Copy:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Run the SQL migrations in order from `supabase/migrations/`.
4. Create at least one admin user.
5. Run `npm run qa:create-user -- --email ... --password ... --role system_admin` if you want a scripted QA/admin account.

## 2. Apply migrations

Recommended order:

1. Run every file in `supabase/migrations/` in ascending filename order.
2. Confirm the `role`, `permission`, `app_user_profile`, `audit_log`, `movement_reason`, and `system_setting` tables exist.
3. Confirm Row Level Security is enabled on all operational tables.

## 3. Optional development seed

After migrations and after at least one user profile exists:

1. Run `supabase/seeds/dev_seed.sql`
2. Confirm that sample categories, locations, and maintenance vendors appear in the UI.

## 4. Configure Vercel

Set these environment variables in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `QA_USER_EMAIL` (optional)
- `QA_USER_PASSWORD` (optional)
- `QA_USER_DISPLAY_NAME` (optional)
- `QA_USER_ROLE_KEY` (optional)

Build settings:

- Install command: `npm install`
- Build command: `npm run build`
- Output: default Next.js output

## 5. Post-deploy smoke test

Run:

```bash
SMOKE_BASE_URL=https://your-app.vercel.app npm run smoke:prod
```

Expected checks:

- `/health`
- `/login`
- preview routes for dashboard, assets, consumables, deployments, locations, maintenance, audit, reports, and scan

## 6. Production verification

Before client testing:

- Confirm login works with a real user.
- Confirm ordinary users cannot open `/settings` or `/audit`.
- Confirm admins can access `/settings` and `/audit`.
- Confirm report exports download.
- Confirm QR preview routes resolve.
- Confirm offline queue status appears in the UI.
