# Salvation Emergency Services Assets - Checklist

Use this as the working checklist for the Salvation Army Emergency Services Asset Register PWA. Keep it practical: finish one vertical slice at a time, test it with the actual workflow, then move on.

## 0. Project Framing

- [ ] Confirm the primary client contact and decision-maker.
- [ ] Confirm who will use the system day to day.
- [ ] Confirm the MVP goal in plain business language.
- [ ] Confirm the first live-use milestone.
- [ ] Confirm what data currently exists.
- [ ] Confirm whether existing data is in spreadsheets, paper records, SharePoint, email, or another system.
- [ ] Confirm which Victorian locations must be included for MVP.
- [ ] Confirm which locations can wait until Phase 2.
- [ ] Confirm laptop, iPad, iPhone, Android, and desktop usage expectations.
- [ ] Confirm offline scenarios that matter most.
- [ ] Confirm who needs admin access.
- [ ] Confirm who needs ordinary user access.
- [ ] Confirm whether volunteers and staff need different access patterns.
- [ ] Confirm what reports are currently required by management.
- [ ] Confirm what reports are currently required for audit/compliance.
- [ ] Confirm what exports are required: CSV, PDF, XLSX, or all three.
- [ ] Confirm document/photo storage expectations.
- [ ] Confirm whether QR labels will be printed internally or externally.
- [ ] Confirm whether the system needs to support multiple states later.
- [ ] Write down explicit MVP exclusions.
- [ ] Write down Phase 2 candidates.
- [ ] Write down Phase 3 candidates.
- [ ] Agree how scope changes will be handled.

## 1. Client Qualification and Delivery Fit

- [ ] Confirm this project is a good proof point for emergency services work.
- [ ] Confirm the work can be delivered iteratively.
- [ ] Confirm v1 can be shipped in 2-4 weeks.
- [ ] Confirm the project has a clear operational pain, not just a technical wish list.
- [ ] Confirm the client understands custom software is phased and collaborative.
- [ ] Confirm the client is willing to test early versions.
- [ ] Confirm the client is willing to nominate real users for feedback.
- [ ] Confirm the budget can support at least one complete vertical slice.
- [ ] Confirm the project does not rely on unpaid 24/7 support.
- [ ] Confirm handoff and training are included.
- [ ] Confirm the client will own the code and data.

## 2. MVP Scope

- [ ] Define MVP modules.
- [ ] Define modules deferred to Phase 2.
- [ ] Define modules deferred to Phase 3.
- [ ] Define acceptance criteria for MVP.
- [ ] Define what "ready for pilot" means.
- [ ] Define what "ready for production" means.
- [ ] Define supported browsers.
- [ ] Define supported mobile/tablet devices.
- [ ] Define minimum offline capability for MVP.
- [ ] Define minimum reporting capability for MVP.
- [ ] Define minimum audit trail capability for MVP.
- [ ] Define data migration scope for MVP.
- [ ] Define support expectations after launch.

## 3. Technical Foundation

- [x] Create or verify the Next.js app.
- [x] Use TypeScript.
- [x] Use Tailwind CSS.
- [x] Use shadcn/ui or the agreed component system.
- [x] Add ESLint.
- [x] Add Prettier.
- [x] Add Vitest.
- [x] Add Playwright.
- [x] Add project scripts for linting, tests, build, and dev server.
- [x] Add environment variable validation.
- [x] Add a safe health route.
- [x] Add a consistent app shell.
- [x] Add mobile-friendly navigation.
- [x] Add desktop-friendly navigation.
- [x] Add protected route structure.
- [ ] Add error boundaries where appropriate.
- [ ] Add loading states.
- [x] Add empty states.
- [x] Add form validation patterns.
- [x] Add consistent date/time formatting.
- [ ] Add currency formatting for asset and stock values.
- [ ] Add reusable status badges.
- [x] Add reusable table patterns.
- [ ] Add reusable filters.
- [ ] Add reusable export actions.
- [ ] Add reusable confirmation dialogs for destructive or archive actions.

## 4. Supabase and Database Foundation

- [ ] Create Supabase project or confirm existing project.
- [ ] Set up local environment variables.
- [x] Set up Supabase browser client.
- [x] Set up Supabase server client.
- [ ] Define database naming conventions.
- [x] Create migration workflow.
- [x] Create user profile table.
- [x] Create role table.
- [x] Create permission table.
- [x] Create role_permission table.
- [x] Create audit_log table.
- [x] Enable Row Level Security on all tables.
- [x] Add RLS policies for system admins.
- [x] Add RLS policies for ordinary users.
- [x] Add created_at and updated_at fields where needed.
- [x] Add created_by and updated_by fields where needed.
- [x] Add archived_at or soft-delete fields where needed.
- [x] Add indexes for common filters.
- [ ] Add indexes for QR lookup fields.
- [ ] Add indexes for reporting queries.
- [ ] Add database comments for important business rules.
- [x] Generate or maintain TypeScript database types.
- [x] Test key RLS policies.

## 5. Authentication and Roles

- [x] Implement login.
- [x] Implement logout.
- [x] Protect app routes.
- [x] Keep `/login` public.
- [x] Keep `/health` public if required.
- [x] Load current user profile.
- [x] Load current user role.
- [x] Show current user email.
- [x] Show current user role.
- [x] Restrict Settings to system admins.
- [x] Restrict Audit Trail to system admins.
- [x] Confirm ordinary users can access operational modules.
- [x] Confirm unauthenticated users are redirected to login.
- [ ] Confirm auth works on mobile.
- [ ] Confirm session refresh works.
- [ ] Confirm auth errors have plain-language messages.

## 6. Navigation and App Shell

- [x] Add Dashboard route.
- [x] Add Locations route.
- [x] Add Assets route.
- [x] Add Consumables route.
- [x] Add Deployments route.
- [x] Add Maintenance route.
- [x] Add Reports route.
- [x] Add Settings route.
- [x] Add Audit Trail route for admins.
- [ ] Add QR scan entry point.
- [ ] Add clear active navigation state.
- [ ] Add mobile navigation drawer.
- [x] Add tablet-friendly layout.
- [x] Add desktop sidebar layout.
- [ ] Confirm navigation is usable with touch.
- [ ] Confirm key workflows can be reached in two clicks or less.

## 7. Locations

- [x] Create location table.
- [x] Support warehouses.
- [x] Support storage facilities.
- [x] Support temporary deployment locations.
- [x] Add location create form.
- [x] Add location edit form.
- [x] Add location archive action.
- [x] Add location list.
- [ ] Add location detail page.
- [ ] Show assets at a location.
- [ ] Show consumables at a location.
- [ ] Show stock thresholds by location.
- [ ] Add location filters.
- [ ] Add location search.
- [x] Add location audit logging.
- [x] Add location RLS policies.
- [x] Add location tests.
- [x] Confirm archived locations do not appear in ordinary selection lists.
- [x] Confirm archived locations remain available for historical reports.

## 8. Asset Categories

- [x] Create asset category table.
- [ ] Add create/edit/archive category workflows.
- [ ] Support category-specific labels if needed.
- [x] Confirm categories are admin-managed.
- [x] Confirm archived categories remain visible on historical assets.
- [ ] Add category audit logging.
- [x] Add category tests.

## 9. Asset Management

- [x] Create asset table.
- [x] Add unique asset ID.
- [x] Add QR code field.
- [x] Add asset name.
- [x] Add category.
- [x] Add description.
- [x] Add serial number.
- [x] Add make.
- [x] Add model.
- [x] Add purchase date.
- [x] Add purchase cost.
- [x] Add replacement value.
- [x] Add current value.
- [x] Add current location.
- [x] Add status.
- [x] Add parent asset assignment.
- [ ] Add assigned deployment.
- [x] Add notes.
- [ ] Add photo/document support.
- [x] Add asset list.
- [x] Add asset detail page.
- [x] Add asset create form.
- [x] Add asset edit form.
- [x] Add asset archive action.
- [x] Add asset filters.
- [x] Add asset search.
- [x] Add asset status workflow.
- [x] Support Available status.
- [x] Support Deployed status.
- [x] Support In Transit status.
- [x] Support Under Maintenance status.
- [x] Support Damaged status.
- [x] Support Retired status.
- [x] Support Lost/Stolen status.
- [x] Add status change audit logging.
- [x] Add location change audit logging.
- [x] Add asset value change audit logging.
- [x] Add asset tests.
- [x] Confirm duplicate asset IDs are blocked.
- [x] Confirm QR lookup finds the correct asset.
- [ ] Confirm retired assets stay visible in historical reports.

## 10. Parent and Child Asset Relationships

- [x] Create assignment model for parent/child assets.
- [x] Prevent circular parent/child relationships.
- [x] Allow assigning a generator to a trailer.
- [x] Allow assigning a radio kit to a truck.
- [x] Allow assigning a first aid kit to a ute.
- [x] Show child assets on parent asset detail page.
- [x] Show parent asset on child asset detail page.
- [x] Record assignment history.
- [x] Move child assets automatically when parent asset moves.
- [x] Confirm automatic movement creates audit records.
- [x] Confirm users can detach child assets.
- [x] Confirm detaching child assets records history.
- [x] Add parent/child tests.

## 11. Consumable Categories

- [x] Create consumable category table.
- [ ] Add create/edit/archive category workflows.
- [x] Confirm categories are admin-managed.
- [x] Confirm archived categories remain visible on historical records.
- [ ] Add category audit logging.
- [x] Add category tests.

## 12. Consumable Batches

- [x] Create consumable item or batch table.
- [x] Add item name.
- [x] Add category.
- [x] Add batch/lot number.
- [x] Add quantity received.
- [x] Add quantity on hand.
- [x] Add unit cost.
- [x] Add replacement cost.
- [x] Add total batch value calculation.
- [x] Add date received.
- [x] Add supplier/donor.
- [x] Add optional expiry date.
- [x] Add location.
- [x] Add QR code field.
- [ ] Add documents/photos.
- [x] Add batch list.
- [x] Add batch detail page.
- [x] Add batch create form.
- [x] Add batch edit form.
- [x] Add batch archive action.
- [x] Add consumable filters.
- [x] Add consumable search.
- [x] Add batch traceability view.
- [x] Add consumable audit logging.
- [x] Add consumable tests.
- [x] Confirm quantity on hand cannot go below zero.
- [x] Confirm total value updates correctly.
- [x] Confirm expired or near-expiry batches can be identified.

## 13. Stock Movements

- [x] Create stock movement table.
- [x] Support Received movement.
- [x] Support Issued movement.
- [x] Support Transferred movement.
- [x] Support Returned movement.
- [x] Support Adjusted movement.
- [x] Support Written Off movement.
- [x] Support Stocktake Variance movement.
- [x] Add movement reason.
- [x] Add movement quantity.
- [x] Add from location.
- [x] Add to location.
- [x] Add related deployment.
- [x] Add movement user.
- [x] Add movement date/time.
- [x] Add movement notes.
- [x] Add stock movement form.
- [x] Add stock movement ledger view.
- [ ] Add stock movement filters.
- [ ] Add stock movement export.
- [ ] Implement FIFO issuing.
- [ ] Confirm FIFO draws from oldest eligible batch first.
- [ ] Confirm transfer updates source and destination stock.
- [x] Confirm returns update correct batch/location.
- [x] Confirm write-offs reduce stock correctly.
- [x] Confirm adjustments require a reason.
- [x] Add stock movement audit logging.
- [x] Add stock movement tests.

## 14. Stock Thresholds and Alerts

- [ ] Create stock threshold table.
- [ ] Set threshold by consumable and location.
- [ ] Show current stock level.
- [ ] Show minimum stock level.
- [ ] Show low-stock alert.
- [ ] Show out-of-stock alert.
- [ ] Add dashboard alert tile.
- [ ] Add low-stock report.
- [ ] Add threshold create/edit workflow.
- [ ] Add threshold audit logging.
- [ ] Add threshold tests.
- [ ] Confirm archived locations do not create active alerts.
- [ ] Confirm archived consumables do not create active alerts.

## 15. Plant and Fleet

- [ ] Identify which assets count as plant/fleet.
- [ ] Add plant/fleet extension fields.
- [ ] Add registration number.
- [ ] Add registration expiry.
- [ ] Add insurance expiry.
- [ ] Add roadworthy/compliance date.
- [ ] Add odometer reading.
- [ ] Add hour meter reading.
- [ ] Add fuel type.
- [ ] Add service provider.
- [ ] Show attached assets.
- [ ] Add plant/fleet filters.
- [ ] Add expiry alerts.
- [ ] Add plant/fleet tests.
- [ ] Confirm fleet records still behave as assets.

## 16. Planned Maintenance

- [ ] Create maintenance schedule table.
- [ ] Create maintenance record table.
- [ ] Add maintenance type.
- [ ] Add service interval by date.
- [ ] Add service interval by odometer.
- [ ] Add service interval by hours.
- [ ] Add next service due date.
- [ ] Add next service due reading.
- [ ] Add service provider.
- [ ] Add reminder threshold.
- [ ] Add maintenance status.
- [ ] Add maintenance record date.
- [ ] Add service type.
- [ ] Add service description.
- [ ] Add maintenance cost.
- [ ] Add supplier/provider.
- [ ] Add odometer/hour reading.
- [ ] Add documents/invoices.
- [ ] Add photos.
- [ ] Add notes.
- [ ] Add recorded by.
- [ ] Show maintenance due soon alerts.
- [ ] Show overdue maintenance alerts.
- [ ] Show registration expiry alerts.
- [ ] Show insurance expiry alerts.
- [ ] Add maintenance calendar/list view.
- [ ] Add maintenance audit logging.
- [ ] Add maintenance tests.

## 17. Deployments

- [ ] Create deployment table.
- [ ] Define deployment statuses.
- [ ] Add deployment name.
- [ ] Add deployment type/reason.
- [ ] Add start date/time.
- [ ] Add end date/time.
- [ ] Add deployment location.
- [ ] Add notes.
- [ ] Add deployment list.
- [ ] Add deployment detail page.
- [ ] Add deployment create form.
- [ ] Add deployment edit form.
- [ ] Assign assets to deployment.
- [ ] Assign consumables to deployment.
- [ ] Issue consumables to deployment through stock movement ledger.
- [ ] Return assets from deployment.
- [ ] Return consumables from deployment if applicable.
- [ ] Show deployment history for an asset.
- [ ] Show deployment history for consumables.
- [ ] Add deployment audit logging.
- [ ] Add deployment tests.

## 18. QR Codes and Scanning

- [ ] Define QR code format.
- [ ] Generate QR codes for assets.
- [ ] Generate QR codes for consumable batches.
- [ ] Generate QR codes for locations if needed.
- [ ] Add QR code display on detail pages.
- [ ] Add QR code print/export workflow.
- [ ] Add scan route.
- [ ] Add mobile camera scanning.
- [ ] Add fallback manual QR/code entry.
- [ ] Route scanned asset QR to asset detail/actions.
- [ ] Route scanned consumable QR to batch detail/actions.
- [ ] Route scanned location QR to location detail/actions if used.
- [ ] Add scan actions: view, move, deploy, maintain, stock movement.
- [ ] Confirm QR scanning works on iOS.
- [ ] Confirm QR scanning works on Android.
- [ ] Confirm QR scanning works offline where feasible.
- [ ] Add QR tests.

## 19. Attachments, Photos, and Documents

- [ ] Configure Supabase Storage.
- [ ] Define storage buckets.
- [ ] Define accepted file types.
- [ ] Define max upload size.
- [ ] Add attachment metadata table.
- [ ] Support asset attachments.
- [ ] Support consumable batch attachments.
- [ ] Support maintenance invoice attachments.
- [ ] Support deployment attachments.
- [ ] Support photo uploads from mobile.
- [ ] Support document uploads from desktop.
- [ ] Add attachment preview/download.
- [ ] Add attachment archive/delete policy.
- [ ] Add attachment audit logging.
- [ ] Add storage RLS policies.
- [ ] Add attachment tests.
- [ ] Confirm sensitive files are not public.

## 20. Offline-First and Sync

- [ ] Define offline-first scope for MVP.
- [ ] Add service worker.
- [ ] Add app install/PWA manifest.
- [ ] Add IndexedDB storage.
- [ ] Cache reference data.
- [ ] Cache recently viewed assets.
- [ ] Cache recently viewed consumables.
- [ ] Queue offline creates.
- [ ] Queue offline edits.
- [ ] Queue offline stock movements.
- [ ] Queue offline maintenance records.
- [ ] Queue offline deployment actions.
- [ ] Add sync status indicator.
- [ ] Add pending changes view.
- [ ] Add retry sync action.
- [ ] Add conflict detection.
- [ ] Add conflict resolution rules.
- [ ] Add offline_sync_reference to audit logs.
- [ ] Confirm offline changes sync when internet returns.
- [ ] Confirm duplicate submissions are avoided.
- [ ] Confirm users understand when data is pending sync.
- [ ] Add offline/sync tests.

## 21. Dashboard

- [ ] Add dashboard route.
- [ ] Show asset counts by status.
- [ ] Show low-stock alerts.
- [ ] Show out-of-stock alerts.
- [ ] Show maintenance due soon.
- [ ] Show overdue maintenance.
- [ ] Show registration/insurance expiry alerts.
- [ ] Show active deployments.
- [ ] Show recent stock movements.
- [ ] Show recent asset changes.
- [ ] Make dashboard tiles clickable.
- [ ] Add dashboard filters if needed.
- [ ] Confirm dashboard loads quickly.
- [ ] Add dashboard tests.

## 22. Audit Trail

- [ ] Log create actions.
- [ ] Log update actions.
- [ ] Log archive/soft-delete actions.
- [ ] Log status changes.
- [ ] Log stock movements.
- [ ] Log deployment assignments.
- [ ] Log parent/child assignment changes.
- [ ] Log maintenance records.
- [ ] Log attachment changes.
- [ ] Include user ID.
- [ ] Include action type.
- [ ] Include record type.
- [ ] Include record ID.
- [ ] Include old value where useful.
- [ ] Include new value where useful.
- [ ] Include device source where useful.
- [ ] Include offline sync reference where useful.
- [ ] Add audit trail list view.
- [ ] Add audit trail filters.
- [ ] Add audit trail detail view.
- [ ] Restrict audit trail to system admins.
- [ ] Add audit export.
- [ ] Add audit tests.

## 23. Reporting and Export

- [ ] Add reports route.
- [ ] Add asset register report.
- [ ] Add asset value report.
- [ ] Add assets by location report.
- [ ] Add assets by status report.
- [ ] Add consumables by location report.
- [ ] Add low-stock report.
- [ ] Add stock movement report.
- [ ] Add deployment report.
- [ ] Add maintenance report.
- [ ] Add audit report.
- [ ] Add report filters.
- [ ] Add date range filters.
- [ ] Add location filters.
- [ ] Add category filters.
- [ ] Add status filters.
- [ ] Add CSV export.
- [ ] Add XLSX export if required.
- [ ] Add PDF export if required.
- [ ] Confirm reports match client expectations.
- [ ] Confirm exports are readable by non-technical users.
- [ ] Add report tests.

## 24. Settings and Admin

- [ ] Add settings route.
- [ ] Add user management if in scope.
- [ ] Add role assignment if in scope.
- [ ] Add location management access.
- [ ] Add category management access.
- [ ] Add movement reason management.
- [ ] Add system settings.
- [ ] Add archive/restore workflows if required.
- [ ] Restrict settings to system admins.
- [ ] Add admin audit logging.
- [ ] Add admin tests.

## 25. Testing

- [x] Add unit tests for shared utilities.
- [x] Add unit tests for validation logic.
- [ ] Add unit tests for status transitions.
- [ ] Add unit tests for FIFO calculations.
- [ ] Add unit tests for stock movement calculations.
- [x] Add unit tests for audit payload construction.
- [ ] Add integration tests for database operations where practical.
- [ ] Add RLS policy tests where practical.
- [x] Add Playwright smoke test for dashboard.
- [ ] Add Playwright test for login redirect.
- [ ] Add Playwright test for location CRUD.
- [ ] Add Playwright test for asset CRUD.
- [ ] Add Playwright test for consumable stock movement.
- [ ] Add Playwright test for deployment flow.
- [ ] Add Playwright test for maintenance record flow.
- [ ] Add Playwright test for reports route.
- [ ] Add mobile viewport tests.
- [ ] Add offline behaviour tests where practical.
- [x] Run lint before handoff.
- [x] Run unit tests before handoff.
- [ ] Run Playwright tests before handoff.
- [x] Run production build before handoff.

## 26. Data Migration

- [ ] Collect current asset data.
- [ ] Collect current consumable data.
- [ ] Collect current location data.
- [ ] Collect current category lists.
- [ ] Collect current maintenance records if available.
- [ ] Collect current deployment records if available.
- [ ] Identify duplicate asset records.
- [ ] Identify missing serial numbers.
- [ ] Identify missing locations.
- [ ] Identify unclear statuses.
- [ ] Identify inconsistent category names.
- [ ] Prepare migration mapping.
- [ ] Prepare sample import.
- [ ] Validate sample import with client.
- [ ] Prepare full import.
- [ ] Validate full import counts.
- [ ] Validate high-value assets manually.
- [ ] Validate stock quantities manually.
- [ ] Keep a rollback/export copy.

## 27. Security, Privacy, and Reliability

- [x] Confirm no secrets are committed.
- [x] Confirm environment variables are documented.
- [ ] Confirm RLS is enabled on all relevant tables.
- [ ] Confirm ordinary users cannot access admin-only data.
- [ ] Confirm deleted/archived records are handled safely.
- [ ] Confirm file uploads are access-controlled.
- [ ] Confirm audit logs cannot be casually edited.
- [ ] Confirm backups are configured.
- [ ] Confirm data export is available.
- [ ] Confirm account recovery process is clear.
- [ ] Confirm production error handling is acceptable.
- [ ] Confirm monitoring/logging plan is appropriate for project size.

## 28. UX and Field Usability

- [ ] Test on a laptop.
- [ ] Test on an iPad or tablet.
- [ ] Test on an iPhone.
- [ ] Test on an Android phone if available.
- [ ] Confirm forms are usable with touch.
- [ ] Confirm tables are readable on tablet.
- [ ] Confirm important actions are not hidden.
- [ ] Confirm buttons have clear labels or familiar icons.
- [ ] Confirm status colours are understandable.
- [ ] Confirm empty states tell users what to do next.
- [ ] Confirm error messages are plain-language.
- [ ] Confirm users can recover from mistakes.
- [ ] Confirm scanning workflow works in a realistic environment.
- [ ] Confirm offline state is obvious.
- [ ] Confirm pending sync state is obvious.
- [ ] Confirm the app does not feel like a technical demo.

## 29. Deployment

- [ ] Choose deployment target.
- [ ] Confirm domain/subdomain.
- [ ] Configure production environment variables.
- [ ] Configure Supabase production project.
- [ ] Run database migrations in production.
- [ ] Configure storage buckets in production.
- [ ] Configure auth settings in production.
- [ ] Configure redirect URLs.
- [ ] Run production build.
- [ ] Deploy app.
- [ ] Smoke test production login.
- [ ] Smoke test production dashboard.
- [ ] Smoke test production asset flow.
- [ ] Smoke test production stock movement flow.
- [ ] Smoke test production report export.
- [ ] Smoke test production mobile access.
- [ ] Document deployment steps.

## 30. Client Testing and Feedback

- [ ] Prepare pilot test script.
- [ ] Pick 2-3 real users for pilot testing.
- [ ] Test adding a location.
- [ ] Test adding an asset.
- [ ] Test moving an asset.
- [ ] Test assigning a child asset.
- [ ] Test adding a consumable batch.
- [ ] Test issuing consumables.
- [ ] Test transferring stock.
- [ ] Test creating a deployment.
- [ ] Test assigning assets to a deployment.
- [ ] Test recording maintenance.
- [ ] Test uploading a photo/document.
- [ ] Test scanning a QR code.
- [ ] Test working offline.
- [ ] Test syncing after reconnecting.
- [ ] Test exporting a report.
- [ ] Capture user confusion points.
- [ ] Capture missing must-have fields.
- [ ] Capture nice-to-have requests separately.
- [ ] Convert feedback into MVP fixes or Phase 2 backlog.

## 31. Documentation and Handoff

- [ ] Write admin guide.
- [ ] Write ordinary user guide.
- [ ] Write quick-start guide.
- [ ] Write QR scanning instructions.
- [ ] Write stock movement instructions.
- [ ] Write deployment workflow instructions.
- [ ] Write maintenance workflow instructions.
- [ ] Write reporting/export instructions.
- [ ] Write backup/export notes.
- [ ] Write environment setup notes.
- [ ] Write deployment notes.
- [ ] Write data model overview.
- [ ] Write known limitations.
- [ ] Write Phase 2 backlog.
- [ ] Prepare training session.
- [ ] Record training if useful.
- [ ] Confirm client knows how to request support.
- [ ] Confirm client knows what is included in support.
- [ ] Confirm client has access to code and data.

## 32. Phase 2 Backlog Candidates

- [ ] Advanced user management.
- [ ] Multi-state support.
- [ ] More granular permissions.
- [ ] Advanced QR label printing.
- [ ] Barcode scanner hardware support.
- [ ] Advanced dashboard analytics.
- [ ] Scheduled email reports.
- [ ] More detailed financial depreciation.
- [ ] Supplier/donor management.
- [ ] Purchase/order request workflows.
- [ ] Approval workflows if later required.
- [ ] Advanced offline conflict resolution.
- [ ] Integration with existing Microsoft 365/SharePoint workflows.
- [ ] Integration with finance or procurement systems.
- [ ] Public disaster response reporting if appropriate.

## 33. Weekly Alex Rhythm

- [ ] Monday: choose the one delivery outcome that matters most this week.
- [ ] Monday: confirm any client questions blocking delivery.
- [ ] Monday-Wednesday: protect 5-6 hour focused delivery blocks.
- [ ] Monday-Wednesday: ship one working slice before polishing.
- [ ] Daily: send concise client progress update if work is active.
- [ ] Daily: write down decisions while they are fresh.
- [ ] Thursday: spend 1-2 hours learning or improving reusable patterns.
- [ ] Friday: follow up sales/referral conversations.
- [ ] Friday: update project notes and invoice/timesheet records.
- [ ] Friday: review scope creep and raise contract changes if needed.
- [ ] Weekly: check billable/admin/sales balance.
- [ ] Weekly: check whether this project is creating a reusable proof point.

## 34. Done Criteria

- [ ] MVP workflows are implemented.
- [ ] MVP workflows are tested with realistic data.
- [ ] Client has tested the core workflows.
- [ ] Critical feedback has been resolved.
- [ ] Deferred requests are documented.
- [ ] Production deployment is complete.
- [ ] Production smoke tests pass.
- [ ] Reports and exports work.
- [ ] Audit trail works.
- [ ] Offline/sync behaviour meets agreed MVP scope.
- [ ] Documentation is complete enough for handoff.
- [ ] Training has been delivered or scheduled.
- [ ] Client has code/data ownership path.
- [ ] Support expectations are clear.
- [ ] Final invoice/milestone paperwork is ready.
