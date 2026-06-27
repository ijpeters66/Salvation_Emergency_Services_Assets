# Operations and Security

## Backup and restore notes

Minimum backup posture:

- Enable Supabase automated backups.
- Export schema and migration files into source control.
- Export critical operational reports on a schedule if client policy requires offline retention.

Restore rehearsal:

1. Provision a temporary Supabase project.
2. Reapply `supabase/migrations/`.
3. Restore database backup into that environment.
4. Confirm login, dashboard preview routes, and key record pages load.

## RLS review checklist

- Confirm every operational table has RLS enabled.
- Confirm system admin policies can read and manage admin-only data.
- Confirm ordinary users cannot read `/audit` data.
- Confirm ordinary users cannot write `/settings` data.
- Confirm historical archived records remain visible where reporting requires them.
- Confirm storage access is aligned with attachment ownership rules.
- Confirm service-role scripts are used only for setup/admin tasks.

## Security headers

The app sets:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `Cross-Origin-Opener-Policy`

## Offline/Sync observability

The application emits structured observability events for:

- offline sync failures
- offline sync conflicts
- queued mutation failures after retries

Current hook surface:

- browser console logging
- `window` event dispatch via `saes:observability`
- server-side structured logging for offline sync API failures

## Release checklist

- `npm run lint`
- `npm test`
- `npm run build`
- `SMOKE_BASE_URL=... npm run smoke:prod`
- review Supabase auth users and admin roles
- confirm report branding in `/settings`
- confirm audit events appear after admin and operational changes
