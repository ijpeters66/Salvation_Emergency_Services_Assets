# Salvation Army Emergency Services Asset Register

A Progressive Web Application for Salvation Army Emergency Services Victoria to manage operational assets, consumables, fleet/plant, deployments, maintenance, stock movements, QR scanning, documents, audit history, and reporting.

The app is intended for real emergency services workflows across laptops, desktops, iOS devices, and Android devices, including offline use when connectivity is unreliable.

## Project Status

This repository currently contains the project specification, implementation blueprint, and delivery checklist.

- [SPECIFICATION.md](SPECIFICATION.md) defines the product requirements.
- [PROMPT.md](PROMPT.md) breaks the build into test-driven implementation prompts.
- [todo.md](todo.md) is the detailed delivery checklist.

Implementation should proceed in small vertical slices. Each slice should connect the user interface, database, permissions, validation, tests, audit trail, and relevant offline behaviour where required.

## Core Goals

- Replace fragile spreadsheet/manual asset tracking with a purpose-built asset register.
- Track non-consumable assets individually.
- Track consumables by batch/lot with FIFO stock movement history.
- Support multiple Victorian warehouses, storage facilities, and temporary deployment locations.
- Give operational users a clear way to move, issue, deploy, maintain, and report on assets.
- Keep a full audit trail for important changes.
- Support QR code generation and scanning.
- Work offline and synchronise when connectivity returns.
- Preserve client ownership of code and data.

## Users and Roles

### System Admin

System admins can:

- Manage users.
- Manage locations.
- Manage asset categories.
- Manage consumable categories.
- Manage system settings.
- View all reports.
- Export reports.
- Archive or soft-delete records.
- Access the audit trail.

### User

Users can:

- Add and edit assets.
- Add and edit consumable batches.
- Record stock movements.
- Check assets in and out.
- Record deployments.
- Record maintenance activities.
- Upload documents and photos.
- View dashboard and reports.

There is no approval workflow in the MVP. Users make changes directly, with important actions recorded in the audit trail.

## MVP Feature Areas

- Authentication and protected routes.
- Role-based navigation and access control.
- Location management.
- Asset category management.
- Asset register and asset status workflow.
- Parent/child asset assignments.
- Consumable category management.
- Consumable batch tracking.
- Stock movement ledger.
- FIFO issuing.
- Minimum stock thresholds and alerts.
- Plant and fleet details.
- Maintenance schedules and maintenance records.
- Deployment records.
- Asset and consumable assignment to deployments.
- QR code generation and scanning.
- Photo and document attachments.
- Offline cache, offline queue, and sync.
- Dashboard alerts and operational summaries.
- Audit trail.
- Reports and exports.

## Recommended Architecture

The planned stack is:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth
- PostgreSQL
- Supabase Row Level Security
- Supabase Storage
- IndexedDB
- Service worker/PWA support
- Vitest
- Playwright

Core architecture principles:

- Offline-first data model.
- Server-authoritative sync with conflict handling.
- Strong audit logging for important changes.
- Role-based access from the start.
- Small vertical slices instead of isolated modules.
- No orphaned features: every feature should be wired into navigation, permissions, tests, and data flows.

## Main Workflows

### Locations

The system supports Victorian warehouses, storage facilities, and temporary deployment locations. Locations can be created, edited, archived, and used for asset, consumable, threshold, and report filtering.

### Assets

Non-consumable assets are tracked individually with a unique asset ID, QR code, category, serial details, value fields, location, status, parent assignment, deployment assignment, notes, attachments, and audit history.

Supported statuses:

- Available
- Deployed
- In Transit
- Under Maintenance
- Damaged
- Retired
- Lost/Stolen

### Parent/Child Asset Assignment

Assets can be assigned to another asset or plant item, such as a generator assigned to a trailer. Child assets should move automatically when the parent asset moves, with assignment history and audit records retained.

### Consumables

Consumables are tracked by batch/lot. Example items include mattresses, blankets, sheets, hygiene kits, and food packs.

Each batch should track received quantity, quantity on hand, cost, replacement value, supplier/donor, expiry date where relevant, location, QR code, stock movement history, documents, photos, and audit history.

### Stock Movements

Supported movement types:

- Received
- Issued
- Transferred
- Returned
- Adjusted
- Written Off
- Stocktake Variance

Movement reasons should be configurable and may include flood response, fire response, training exercise, community support, stock transfer, maintenance, and disposal/write-off.

### Plant and Fleet

Fleet and plant items are treated as assets with additional fields such as registration number, registration expiry, insurance expiry, roadworthy/compliance date, odometer reading, hour meter reading, fuel type, service provider, maintenance schedule, and attached assets.

### Maintenance

Maintenance should support scheduled maintenance and completed maintenance records. Alerts should cover due soon, overdue, registration expiry, and insurance expiry scenarios.

### Deployments

Deployments should support assigning assets and issuing consumables to an operational event, with history retained for both the deployment and the affected items.

### QR Codes

QR codes should be generated for assets and consumable batches. Scanning should route users to the relevant record and offer context-appropriate actions such as view, move, deploy, maintain, or record stock movement.

### Attachments

The system should support photo and document uploads for assets, consumables, maintenance records, and deployments. Storage access must be controlled and sensitive files should not be public.

## Offline-First Requirements

The app must support offline work where practical, especially for field workflows.

Minimum expectations:

- Cache reference data.
- Cache recently viewed records.
- Queue offline creates and edits.
- Queue stock movements made offline.
- Queue deployment and maintenance actions made offline.
- Show clear sync status.
- Show pending changes.
- Retry sync when connectivity returns.
- Detect and handle conflicts.
- Prevent duplicate submissions.

## Audit Trail

Important changes should be recorded with:

- User ID.
- Action type.
- Record type.
- Record ID.
- Old value where useful.
- New value where useful.
- Device source where useful.
- Offline sync reference where useful.
- Timestamp.

Audit logs are especially important for asset movements, stock movements, status changes, maintenance records, deployment assignments, attachments, and archive actions.

## Reports and Exports

Planned reports include:

- Asset register.
- Asset value report.
- Assets by location.
- Assets by status.
- Consumables by location.
- Low-stock report.
- Stock movement report.
- Deployment report.
- Maintenance report.
- Audit report.

CSV export should be included early. XLSX and PDF export can be added where required by the client.

## Suggested Implementation Order

1. Project foundation, app shell, routing, and test setup.
2. Supabase client, environment validation, and shared types.
3. Database foundation: users, roles, permissions, and audit logs.
4. Authentication and protected routes.
5. Location management as the first full vertical slice.
6. Asset categories and asset CRUD.
7. Asset status workflow.
8. Parent/child asset assignment.
9. Consumable categories, items, and batches.
10. Stock movement ledger and FIFO issuing.
11. Stock thresholds and alerts.
12. Plant/fleet extension fields.
13. Maintenance schedules and records.
14. Deployments and deployment assignments.
15. QR generation and scanning.
16. Attachments.
17. Offline cache, queue, sync, and conflict handling.
18. Dashboard.
19. Reporting and exports.
20. End-to-end testing, client pilot, deployment, and handoff.

## Development Setup

The application has not been scaffolded yet. Once the app exists, this section should be updated with exact commands.

Expected setup shape:

```bash
npm install
npm run dev
```

Expected quality commands:

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

## Environment Variables

Environment variables should be validated at startup and must not expose secrets through the UI or health checks.

Expected variables once Supabase is added:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The service role key must only be used server-side.

## Testing Expectations

Testing should scale with risk and workflow importance.

Minimum expected coverage:

- Unit tests for shared utilities.
- Unit tests for validation logic.
- Unit tests for status transitions.
- Unit tests for FIFO calculations.
- Unit tests for stock movement calculations.
- Unit tests for audit payload construction.
- RLS policy tests where practical.
- Playwright smoke tests for major routes.
- Playwright tests for key workflows.
- Mobile viewport checks.
- Offline/sync checks where practical.

Before handoff, run lint, unit tests, end-to-end tests, and a production build.

## Deployment Notes

Deployment target is still to be confirmed. Keep deployment simple and maintainable for a small regional client.

Production setup should include:

- Production environment variables.
- Production Supabase project.
- Database migrations.
- Storage buckets.
- Auth redirect URLs.
- Production build.
- Smoke tests for login, dashboard, asset flow, stock movement flow, report export, and mobile access.
- Clear deployment documentation.

## Client Handoff

The client should retain ownership of the code and data.

Handoff should include:

- Admin guide.
- Ordinary user guide.
- Quick-start guide.
- QR scanning instructions.
- Stock movement instructions.
- Deployment workflow instructions.
- Maintenance workflow instructions.
- Reporting/export instructions.
- Backup/export notes.
- Environment setup notes.
- Deployment notes.
- Data model overview.
- Known limitations.
- Phase 2 backlog.
- Support expectations.

## Phase 2 Candidates

- Advanced user management.
- Multi-state support.
- More granular permissions.
- Advanced QR label printing.
- Barcode scanner hardware support.
- Advanced dashboard analytics.
- Scheduled email reports.
- Detailed depreciation or asset valuation workflows.
- Supplier/donor management.
- Purchase or order request workflows.
- Approval workflows if later required.
- Advanced offline conflict resolution.
- Microsoft 365 or SharePoint workflow integration.
- Finance or procurement system integration.

## Definition of Done

- MVP workflows are implemented.
- MVP workflows are tested with realistic data.
- Client has tested the core workflows.
- Critical pilot feedback has been resolved.
- Deferred requests are documented.
- Production deployment is complete.
- Production smoke tests pass.
- Reports and exports work.
- Audit trail works.
- Offline/sync behaviour meets agreed MVP scope.
- Documentation is complete enough for handoff.
- Training has been delivered or scheduled.
- Client has a clear code and data ownership path.
- Support expectations are clear.
