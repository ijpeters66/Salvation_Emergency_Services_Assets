Below is a test-driven implementation plan based on the uploaded specification for the Salvation Army Emergency Services Asset Register PWA. The MVP includes roles, locations, asset and consumable tracking, stock movements, fleet/plant, maintenance, deployments, QR scanning, offline sync, attachments, dashboard, audit trail, and reporting. 

# Implementation Blueprint

## Architecture Foundation

Build a Next.js, TypeScript, Tailwind, shadcn/ui Progressive Web App backed by Supabase Auth, PostgreSQL, Row Level Security, Supabase Storage, IndexedDB, and a service worker.

Core principles:

1. Offline-first data model.
2. Server-authoritative sync with conflict handling.
3. Strong audit logging for every important change.
4. Role-based access from the start.
5. Small vertical slices that always connect UI, database, validation, tests, and audit trail.
6. No orphaned features: each step must be wired into navigation, permissions, tests, and relevant data flows.

# Iterative Delivery Chunks

## Round 1: Large Feature Areas

1. Project foundation and quality tooling.
2. Supabase schema, auth, roles, and RLS.
3. Locations.
4. Assets and parent/child assignments.
5. Consumables and stock movements.
6. Stock thresholds and alerts.
7. Plant/fleet details.
8. Maintenance schedules and records.
9. Deployments.
10. QR generation and scanning.
11. Attachments.
12. Offline cache and sync.
13. Dashboard.
14. Audit trail.
15. Reporting/export.
16. Final integration and hardening.

## Round 2: Smaller Implementation Slices

1. App shell, routing, test setup, Supabase client.
2. Database migrations for users, roles, permissions, audit logs.
3. Auth flows and protected routes.
4. Location CRUD with soft delete.
5. Asset categories and asset CRUD.
6. Asset status workflow.
7. Parent/child asset assignment.
8. Consumable categories/items/batches.
9. Stock movement ledger.
10. FIFO issuing.
11. Stock thresholds and low-stock calculations.
12. Plant/fleet extension fields.
13. Maintenance scheduling.
14. Maintenance records and alerts.
15. Deployment records.
16. Assign assets and consumables to deployments.
17. QR code generation.
18. QR scan actions.
19. Supabase Storage attachments.
20. IndexedDB offline queue.
21. Sync engine and conflict handling.
22. Dashboard tiles and clickable alerts.
23. Report filters and CSV export.
24. PDF/XLSX export.
25. End-to-end testing and deployment hardening.

## Round 3: Right-Sized Testable Steps

Each step below is small enough to implement with tests, but large enough to move the project forward.

# Code-Generation LLM Prompts

## Prompt 1 — Project Foundation

```text
You are building a production-ready Next.js TypeScript PWA for an emergency services asset register.

Create the initial project foundation.

Requirements:
- Use Next.js App Router.
- Use TypeScript.
- Use Tailwind CSS.
- Add shadcn/ui setup.
- Add ESLint and Prettier.
- Add Vitest for unit tests.
- Add Playwright for end-to-end tests.
- Add a basic app shell with:
  - top navigation
  - sidebar navigation
  - protected content area placeholder
- Add routes:
  - /login
  - /dashboard
  - /locations
  - /assets
  - /consumables
  - /deployments
  - /maintenance
  - /reports
  - /settings

Testing:
- Add a Vitest smoke test for shared utilities.
- Add a Playwright test confirming the dashboard route renders.
- Ensure npm test and npm run lint pass.

Do not implement business logic yet.
Wire the layout into all routes.
```

## Prompt 2 — Supabase Client, Environment, and Shared Types

```text
Add Supabase integration foundation.

Requirements:
- Add Supabase browser client.
- Add Supabase server client.
- Add environment variable validation.
- Create shared TypeScript types for:
  - UserRole: system_admin | user
  - AssetStatus
  - DeploymentStatus
  - StockMovementType
  - AttachmentOwnerType
- Add a typed result/error helper for service functions.
- Add a /health route that confirms the app can load environment configuration without exposing secrets.

Testing:
- Unit test environment validation.
- Unit test shared enum/type guards.
- Playwright test that /health renders a safe status message.

Do not add database migrations yet.
```

## Prompt 3 — Database Foundation: Users, Roles, Audit Logs

```text
Create the first Supabase migration.

Tables:
- app_user_profile
- role
- permission
- role_permission
- audit_log

Requirements:
- app_user_profile links to auth.users.
- Support two roles:
  - system_admin
  - user
- audit_log fields:
  - id
  - user_id
  - action_type
  - record_type
  - record_id
  - old_value jsonb
  - new_value jsonb
  - device_source nullable
  - offline_sync_reference nullable
  - created_at
- Enable Row Level Security.
- Add basic policies:
  - authenticated users can read their own profile.
  - system admins can read all profiles.
  - authenticated users can insert audit logs.
  - system admins can read all audit logs.
- Seed default roles and permissions.

Application:
- Add typed database definitions or generated compatible types.
- Add a server-side audit logging helper.

Testing:
- Add migration tests or SQL policy tests where supported.
- Unit test audit log payload construction.
- Ensure lint and tests pass.
```

## Prompt 4 — Authentication and Protected Routes

```text
Implement authentication.

Requirements:
- Login page using Supabase Auth email/password.
- Logout action.
- Protected route guard for all app routes except /login and /health.
- Load current user profile and role.
- Add role-aware navigation:
  - System Admin sees Settings and Audit links.
  - User sees operational modules only.
- Add a minimal profile menu showing user email and role.

Testing:
- Unit test auth state helper functions.
- Playwright test:
  - unauthenticated user visiting /dashboard is redirected to /login.
  - login page renders.
- Mock Supabase where needed.

Do not implement user management UI yet.
```

## Prompt 5 — Location Management

```text
Implement location management as the first full vertical slice.

Database:
- Create location table with:
  - id
  - name
  - type
  - address nullable
  - state default Victoria
  - notes nullable
  - archived_at nullable
  - created_at
  - updated_at
  - created_by
  - updated_by
- Enable RLS:
  - authenticated users can read active locations.
  - system admins can read archived locations.
  - authenticated users can create/update locations.
  - only system admins can archive locations.

Application:
- Add /locations page with table.
- Add create/edit location form.
- Add soft-delete/archive action for system admins.
- Add “View archived” toggle for system admins.
- Log audit entries for create, update, archive.

Testing:
- Unit test validation schema.
- Unit test location service.
- Playwright test create/edit location flow using mocked Supabase or test database.
- Verify audit helper is called on mutation.

Wire location selection utilities for future asset and consumable forms.
```

## Prompt 6 — Asset Categories and Asset Register

```text
Implement asset category and asset register basics.

Database:
- asset_category table.
- asset table with:
  - unique_asset_id
  - qr_code_value
  - asset_name
  - category_id
  - description
  - serial_number
  - make
  - model
  - purchase_date
  - purchase_cost
  - replacement_value
  - current_value
  - current_location_id
  - status
  - notes
  - archived_at
  - created_at
  - updated_at
  - created_by
  - updated_by

Requirements:
- Unique Asset ID must be unique.
- Status must use the approved asset statuses.
- Asset must belong to a location.
- Add CRUD UI at /assets.
- Add asset detail page /assets/[id].
- Add filters by status, location, and category.
- Add audit logs for create/update/archive.

Testing:
- Unit test asset validation.
- Unit test unique ID generation or validation.
- Integration test asset service CRUD.
- Playwright test asset creation and detail view.

Wire assets into the existing location model.
```

## Prompt 7 — Asset Status Workflow and Movement History

```text
Add asset movement/status history.

Database:
- asset_movement table:
  - id
  - asset_id
  - from_location_id nullable
  - to_location_id nullable
  - from_status nullable
  - to_status
  - reason
  - notes nullable
  - created_by
  - created_at

Application:
- Add status/location change action on asset detail page.
- Every status/location change creates:
  - asset_movement record
  - audit_log record
- Add movement history timeline to asset detail page.

Testing:
- Unit test valid status transitions.
- Integration test that changing location creates movement and audit records.
- Playwright test asset movement appears in history.

Ensure no asset status/location update bypasses the movement service.
```

## Prompt 8 — Parent/Child Asset Assignments

```text
Implement parent/child asset relationships.

Database:
- asset_assignment table:
  - id
  - parent_asset_id
  - child_asset_id
  - assigned_at
  - unassigned_at nullable
  - assigned_by
  - notes nullable
- Prevent an asset from being assigned to itself.
- Prevent circular parent/child relationships.

Application:
- On asset detail page:
  - assign child asset
  - remove child asset
  - show current parent
  - show current children
  - show assignment history
- When a parent asset moves location, automatically move active child assets with it.
- Log audit records for assignment, unassignment, and automatic child movement.

Testing:
- Unit test circular assignment prevention.
- Integration test child moves with parent.
- Playwright test assigning and unassigning child assets.

Wire assignment history into asset detail.
```

## Prompt 9 — Consumable Items and Batches

```text
Implement consumable inventory foundation.

Database:
- consumable_category
- consumable_item
- consumable_batch with:
  - item_id
  - batch_lot_number
  - quantity_received
  - quantity_on_hand
  - unit_cost
  - replacement_cost
  - date_received
  - supplier_donor
  - expiry_date nullable
  - location_id
  - qr_code_value
  - archived_at nullable

Application:
- Add /consumables page.
- Add item and batch management.
- Batch detail page showing quantity, value, location, and expiry.
- Calculate total batch value.
- Add filters by location, category, and low quantity placeholder.

Testing:
- Unit test batch value calculation.
- Unit test validation rules.
- Integration test create/edit batch.
- Playwright test creating a consumable batch.

Do not implement stock movements yet except initial received quantity.
```

## Prompt 10 — Stock Movement Ledger

```text
Implement stock movements.

Database:
- stock_movement table:
  - id
  - consumable_batch_id
  - movement_type
  - quantity
  - from_location_id nullable
  - to_location_id nullable
  - reason
  - related_deployment_id nullable
  - notes nullable
  - created_by
  - created_at

Application:
- Add stock movement service.
- Support movement types:
  - Received
  - Issued
  - Transferred
  - Returned
  - Adjusted
  - Written Off
  - Stocktake Variance
- Updating stock must only happen through the stock movement service.
- Add movement form on batch detail page.
- Add movement history table.
- Log audit entries.

Testing:
- Unit test stock quantity calculations.
- Unit test preventing negative stock.
- Integration test movement creates ledger entry and updates batch.
- Playwright test issuing stock updates quantity and history.

Wire stock movement into consumable batch detail.
```

## Prompt 11 — FIFO Consumable Issuing

```text
Add FIFO issue workflow for consumables.

Requirements:
- Given a consumable item, location, and quantity, issue from oldest available batches first.
- Respect expiry date where present.
- Never issue more than quantity on hand.
- Create one stock_movement record per affected batch.
- Return a clear summary of issued batches.

Application:
- Add “Issue Consumables” workflow from /consumables.
- Allow issue reason and optional notes.
- Show confirmation summary before final submit.

Testing:
- Unit test FIFO selection across multiple batches.
- Unit test partial batch issue.
- Unit test insufficient stock error.
- Integration test multiple stock movement records created.
- Playwright test FIFO issue flow.

Wire this into the existing stock movement service rather than creating a separate path.
```

## Prompt 12 — Stock Thresholds and Alerts

```text
Implement minimum stock thresholds.

Database:
- stock_threshold table:
  - id
  - consumable_item_id
  - location_id
  - minimum_quantity
  - created_at
  - updated_at

Application:
- Add threshold management UI under consumable item detail.
- Calculate current stock by item and location.
- Add alert states:
  - normal
  - low_stock
  - out_of_stock
- Add low-stock and out-of-stock views.
- Add clickable alert links to relevant item/location.

Testing:
- Unit test threshold status calculation.
- Integration test current stock aggregation.
- Playwright test low-stock alert appears after stock issue.

Wire alert calculations for later dashboard use.
```

## Prompt 13 — Plant and Fleet Details

```text
Extend assets to support plant and fleet management.

Database:
- plant_details table linked one-to-one with asset:
  - registration_number
  - registration_expiry
  - insurance_expiry
  - roadworthy_compliance_date
  - odometer_reading
  - hour_meter_reading
  - fuel_type
  - service_provider

Application:
- Add “Mark as plant/fleet item” option on asset form.
- Add plant/fleet section to asset detail page.
- Add attached assets view using existing parent/child assignment system.
- Add filters for plant/fleet items.

Testing:
- Unit test plant detail validation.
- Integration test creating asset with plant details.
- Playwright test plant/fleet section renders.

Do not duplicate asset logic; plant/fleet must extend the existing asset model.
```

## Prompt 14 — Maintenance Schedules

```text
Implement maintenance schedules.

Database:
- maintenance_schedule table:
  - asset_id
  - maintenance_type
  - service_interval_date nullable
  - service_interval_odometer nullable
  - service_interval_hours nullable
  - next_service_due_date nullable
  - next_service_due_reading nullable
  - service_provider nullable
  - reminder_threshold_days nullable
  - status

Application:
- Add maintenance tab to asset detail.
- Add create/edit maintenance schedule.
- Calculate schedule alert state:
  - not_due
  - due_soon
  - overdue
- Add /maintenance page listing due soon and overdue schedules.

Testing:
- Unit test due soon/overdue date calculations.
- Unit test reading-based due calculations.
- Integration test create/update schedule.
- Playwright test due maintenance appears on /maintenance.

Wire maintenance schedules to plant/fleet assets and general assets.
```

## Prompt 15 — Maintenance Records

```text
Implement maintenance records.

Database:
- maintenance_record table:
  - asset_id
  - maintenance_schedule_id nullable
  - date
  - service_type
  - description
  - cost
  - supplier_provider
  - odometer_hour_reading nullable
  - notes nullable
  - recorded_by
  - created_at

Application:
- Add maintenance record form.
- Add maintenance history table on asset detail.
- When a maintenance record is linked to a schedule, update next service due fields.
- Log audit entries.
- Show maintenance cost history.

Testing:
- Unit test next-service recalculation.
- Integration test creating maintenance record updates schedule.
- Playwright test maintenance record appears in asset history.

Prepare attachment hooks but do not implement files yet.
```

## Prompt 16 — Deployment Records

```text
Implement deployment management.

Database:
- deployment table:
  - deployment_id
  - deployment_name
  - purpose_reason
  - deployment_location_site
  - team_name
  - team_leader nullable
  - contact_number nullable
  - start_datetime
  - expected_return_datetime nullable
  - actual_return_datetime nullable
  - status
  - notes nullable
  - damage_fault_notes nullable
  - created_by
  - created_at
  - updated_at

Application:
- Add /deployments page.
- Add create/edit deployment form.
- Add deployment detail page.
- Support statuses:
  - Planned
  - Active
  - Returned
  - Closed
- Add filters by status and date.
- Log audit entries.

Testing:
- Unit test deployment validation.
- Unit test valid status transitions.
- Integration test CRUD.
- Playwright test create deployment and view detail.

Do not assign assets or consumables yet.
```

## Prompt 17 — Deployment Asset Assignment

```text
Add assets to deployments.

Database:
- deployment_asset table:
  - deployment_id
  - asset_id
  - checked_out_at
  - checked_in_at nullable
  - checked_out_by
  - checked_in_by nullable
  - notes nullable

Application:
- On deployment detail:
  - assign available assets
  - check assets out
  - check assets in
  - show currently deployed assets
- When checked out:
  - asset status becomes Deployed
  - assigned deployment is shown on asset detail
  - asset movement record is created
  - audit log is created
- When checked in:
  - asset status becomes Available unless marked damaged/maintenance
  - check-in timestamp is recorded
  - audit log is created

Testing:
- Unit test deployment asset status transitions.
- Integration test check-out/check-in updates asset and deployment_asset.
- Playwright test asset check-out from deployment detail.

Use existing asset movement service.
```

## Prompt 18 — Deployment Consumable Issue

```text
Add consumables to deployments.

Database:
- deployment_consumable table:
  - deployment_id
  - consumable_batch_id
  - stock_movement_id
  - quantity
  - issued_at
  - issued_by

Application:
- On deployment detail:
  - issue consumables using existing FIFO issue workflow
  - link stock movements to deployment
  - show issued consumables summary
- Deployment consumable issue must reduce batch stock through the stock movement service only.

Testing:
- Unit test deployment FIFO issue request.
- Integration test deployment issue creates stock movements and deployment_consumable rows.
- Playwright test issuing consumables to deployment updates deployment detail.

No duplicate stock logic.
```

## Prompt 19 — QR Code Generation

```text
Implement QR code generation.

Requirements:
- Generate QR code values for:
  - assets
  - plant/fleet assets
  - consumable batches
  - locations
- QR value should encode record type and record ID in a stable app-specific format.
- Add QR display component.
- Add printable QR label component.
- Add QR sections to:
  - asset detail
  - consumable batch detail
  - location detail

Testing:
- Unit test QR payload format.
- Unit test QR parser.
- Component test QR display renders expected payload.
- Playwright test QR appears on asset detail page.

Do not implement scanner yet.
```

## Prompt 20 — QR Scanner Actions

```text
Implement QR scanning.

Requirements:
- Add /scan route.
- Use browser camera where available.
- Parse QR payloads from assets, consumable batches, and locations.
- After scan, route user to the correct record.
- Add contextual scan actions:
  - scan to view
  - scan to move asset
  - scan to issue consumables
  - scan during stocktake placeholder
- Provide graceful fallback for devices without camera support.

Testing:
- Unit test QR scan routing logic.
- Component test scanner fallback.
- Playwright test mocked scan routes to asset detail.

Wire scan actions into existing movement and issue services.
```

## Prompt 21 — Document Attachments

```text
Implement document/photo attachments using Supabase Storage.

Database:
- document_attachment table:
  - id
  - owner_type
  - owner_id
  - file_name
  - file_path
  - mime_type
  - file_size
  - uploaded_by
  - created_at
  - archived_at nullable

Supported owner types:
- asset
- plant
- maintenance_record
- deployment
- consumable_batch
- location

Application:
- Add reusable attachment uploader.
- Add attachment list component.
- Add upload/delete/archive behavior.
- Wire attachments into:
  - asset detail
  - consumable batch detail
  - maintenance record detail
  - deployment detail
  - location detail
- Log audit entries.

Testing:
- Unit test allowed file type validation.
- Unit test file size validation.
- Integration test attachment metadata creation.
- Component test attachment list.
- Playwright test upload flow with mocked storage.

Do not bypass attachment metadata table.
```

## Prompt 22 — Offline Storage Foundation

```text
Add offline-first foundation.

Requirements:
- Add PWA manifest.
- Add service worker.
- Add IndexedDB wrapper.
- Cache app shell and essential reference data:
  - locations
  - asset categories
  - consumable categories
  - consumable items
  - recent assets
  - recent consumable batches
- Add online/offline status indicator.
- Add local mutation queue structure with:
  - id
  - operation_type
  - entity_type
  - entity_id
  - payload
  - created_at
  - retry_count
  - sync_status

Testing:
- Unit test IndexedDB wrapper using fake IndexedDB.
- Unit test mutation queue serialization.
- Playwright test offline indicator can render.

Do not implement sync submission yet.
```

## Prompt 23 — Offline Mutations and Sync Engine

```text
Implement offline mutation handling.

Requirements:
- For supported create/update operations, when offline:
  - write optimistic local record
  - enqueue mutation
  - show pending sync status
- When online:
  - submit queued mutations in order
  - update local records with server response
  - preserve audit metadata
- Implement conflict detection using updated_at or version fields.
- On conflict:
  - do not silently overwrite
  - mark record as sync_conflict
  - show conflict resolution UI
- Start with offline support for:
  - assets
  - locations
  - stock movements
  - maintenance records
  - deployments

Testing:
- Unit test queue ordering.
- Unit test retry behavior.
- Unit test conflict detection.
- Integration test offline asset creation syncs when online.
- Playwright test pending sync indicator appears.

Wire sync status into existing forms and detail pages.
```

## Prompt 24 — Dashboard

```text
Implement dashboard.

Dashboard tiles:
- Total Assets
- Assets by Status
- Total Consumable Stock
- Low Stock Items
- Out-of-Stock Items
- Upcoming Maintenance
- Overdue Maintenance
- Registration/Insurance Expiry
- Active Deployments
- Assets Overdue for Return
- Recent Asset Movements
- Recent Stock Movements

Requirements:
- Each alert tile is clickable.
- Dashboard respects role permissions.
- Dashboard uses existing services and aggregation functions.
- Include loading, empty, and error states.

Testing:
- Unit test dashboard aggregation functions.
- Integration test dashboard query service.
- Component test tile rendering.
- Playwright test clicking low-stock tile opens filtered consumables page.

No duplicate business logic; reuse threshold, maintenance, deployment, and movement services.
```

## Prompt 25 — Audit Trail UI

```text
Implement audit trail review.

Requirements:
- Add /audit route visible only to System Admin.
- Add filters:
  - user
  - date range
  - action type
  - record type
- Add audit detail drawer showing old_value and new_value.
- Add links from audit records to affected records where possible.
- Ensure all existing mutation services create audit records consistently.

Testing:
- Unit test audit formatting.
- Integration test audit search filters.
- Playwright test regular user cannot access /audit.
- Playwright test system admin can view audit logs.

Add a test that verifies core mutation services call the audit helper.
```

## Prompt 26 — CSV Reporting

```text
Implement first reporting layer with CSV exports.

Reports:
- Asset Register
- Assets by Location
- Assets by Status
- Inventory Report
- Low Stock Report
- Stock Movement Report
- Maintenance Due Report
- Deployment History
- Audit Trail Report

Requirements:
- Add /reports page.
- Add report filter forms.
- Add CSV export generator.
- Include:
  - report title
  - generated date/time
  - prepared by
  - filters applied
- Enforce role permissions.

Testing:
- Unit test CSV escaping.
- Unit test report filter validation.
- Integration test asset register report data.
- Playwright test generating CSV from reports page.

Wire report links to existing filtered list pages where useful.
```

## Prompt 27 — PDF and XLSX Reporting

```text
Add professional PDF and XLSX exports.

Requirements:
- Add branded report configuration:
  - logo
  - brand colours
  - report titles
  - page numbers
- Add PDF generation for key reports.
- Add XLSX export for key reports.
- Reuse existing report query services from CSV step.
- Add system settings for report branding.
- Add generated metadata:
  - generated date/time
  - prepared by
  - filters applied

Testing:
- Unit test XLSX workbook structure.
- Unit test PDF metadata generation.
- Integration test report settings are applied.
- Playwright test PDF/XLSX export buttons render and call expected endpoints.

Do not duplicate report queries.
```

## Prompt 28 — User and System Settings

```text
Implement System Admin settings.

Requirements:
- Add /settings route for System Admin.
- User management:
  - view users
  - assign role
  - deactivate user profile
- Category management:
  - asset categories
  - consumable categories
- Configurable movement reasons:
  - Flood Response
  - Fire Response
  - Training Exercise
  - Community Support
  - Stock Transfer
  - Maintenance
  - Disposal/Write-Off
- Report branding settings.

Testing:
- Unit test settings validation.
- Integration test role update respects permissions.
- Playwright test regular user cannot access settings.
- Playwright test admin can create movement reason.

Wire configurable reasons into stock movement and deployment forms.
```

## Prompt 29 — End-to-End Workflow Hardening

```text
Add full workflow tests and fix integration gaps.

End-to-end workflows:
1. Admin creates location.
2. User creates asset at location.
3. User assigns child asset to parent asset.
4. User creates consumable batch.
5. User sets stock threshold.
6. User creates deployment.
7. User checks out asset to deployment.
8. User issues consumables to deployment using FIFO.
9. User records maintenance.
10. User uploads attachment.
11. User scans QR to open asset.
12. Admin views audit trail.
13. Admin exports asset and stock reports.

Requirements:
- Add Playwright tests for these workflows.
- Fix any navigation, permission, or service inconsistencies.
- Ensure no orphaned pages, services, or tables remain unused.
- Ensure loading, empty, and error states exist across major pages.

Testing:
- Full Playwright suite.
- Full unit test suite.
- Lint and typecheck.

Do not add new features unless required to complete the workflows.
```

## Prompt 30 — Production Readiness

```text
Prepare the application for production deployment.

Requirements:
- Add deployment documentation for Vercel and Supabase.
- Add database migration instructions.
- Add seed data for development.
- Add backup/restore notes.
- Add RLS policy review checklist.
- Add security headers.
- Add error boundary and global error handling.
- Add observability hooks for sync errors and failed mutations.
- Add accessibility pass on major forms and tables.
- Add final README.

Testing:
- Run typecheck.
- Run lint.
- Run unit tests.
- Run Playwright tests.
- Add smoke test for production build.

Final wiring:
- Confirm all MVP routes are reachable.
- Confirm role permissions work.
- Confirm offline queue works.
- Confirm audit logs are generated.
- Confirm reports export.
- Confirm QR scan/view flow works.

Do not leave TODO-only placeholders for MVP functionality.
```

# Recommended Build Order

Use the prompts in order. The most important rule is that every prompt must leave the app in a working, tested state. The project should evolve from foundation, to data integrity, to operational workflows, to offline capability, to reporting and hardening.
