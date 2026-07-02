# UI / UX Todo

This is a review of the current app UI/UX compared with current best practice for internal operational tools:
- clear information hierarchy
- fast scanability
- responsive layouts that still work on smaller screens
- visible feedback for success, errors, loading, and empty states
- accessible controls, contrast, and keyboard flow
- consistent actions and terminology

## What Already Works

- The app has a clear operational structure with dashboard, assets, locations, maintenance, reports, and scan.
- The visual system is consistent: same card language, same spacing, same brand colors.
- The login flow is simple and low-friction.
- Tables and forms are functional and reasonably well labeled.
- Offline support is already surfaced in the UI, which is a good product signal.

## Priority 1: Highest-Value UX Fixes

- [x] Make the app shell more responsive on smaller screens.
  - The current left navigation is very desktop-first and consumes a lot of width.
  - Best practice is a collapsible nav drawer or compact rail on tablet/mobile, with the current page always obvious.
  - Add a visible active state in the nav and consider breadcrumbs or a page-level back link on deep pages.

- [x] Improve the landing/dashboard hierarchy.
  - The dashboard is useful, but it reads like a status board rather than a decision-making surface.
  - Best practice is to lead with the most urgent operational signals first, then supporting metrics, then recent activity.
  - Add stronger “what needs attention now” treatment for overdue maintenance, low stock, and active deployments.
  - Replace generic placeholder panels with actionable empty states and direct CTAs.

- [x] Tighten action hierarchy on each page.
  - Many pages show create forms, filters, tables, and admin actions with similar visual weight.
  - Best practice is one primary action per screen, with secondary actions visually quieter.
  - For each page, decide what the user should do first and make that the clearest button or panel.

- [x] Improve empty states and no-result states.
  - Several views currently say “No data yet” or “No records match” without enough guidance.
  - Best practice is to explain why the state exists and what to do next.
  - Add concise next-step CTAs such as “Create the first location” or “Clear filters”.

## Priority 2: Forms and Data Entry

- [ ] Break large forms into clearer sections.
  - Asset, maintenance, and location forms are long and visually flat.
  - Best practice is progressive disclosure: group fields into logical blocks such as identity, logistics, financials, and notes.
  - Use section headings or accordions when a form grows past one screen.

- [ ] Add helper text and examples to ambiguous fields.
  - Fields like QR code value, status, maintenance dates, and financial values need more guidance.
  - Best practice is to reduce guessing with short examples and lightweight helper text.
  - Include expected formats, ownership rules, and whether a field is optional.

- [ ] Improve inline validation and error messaging.
  - Current messages are mostly top-level and generic.
  - Best practice is to show field-level errors close to the problem, and keep the copy specific.
  - Distinguish validation errors from network/auth errors and save conflicts.

- [ ] Add confirmation for destructive or high-risk actions.
  - Archive actions are easy to trigger from tables.
  - Best practice is to confirm irreversible or operationally sensitive changes, especially on mobile and for admin actions.
  - Include the record name in the confirmation so the user knows exactly what will happen.

- [ ] Make date and numeric input handling more forgiving.
  - Best practice is to use the right input patterns, default formats, and clear units.
  - Currency, meter readings, and dates should be obvious at the point of entry.

## Priority 3: Tables, Browsing, and Scanning

- [ ] Improve dense tables for operational use.
  - The asset, location, and maintenance tables are clean but feel static and wide.
  - Best practice is sticky table headers, stronger row affordances, and clearer grouping of the most important columns first.
  - Consider a mobile-friendly card layout for narrow screens instead of relying only on horizontal scroll.

- [ ] Make filters easier to use and easier to reset.
  - Filters are currently presented as a long row of controls.
  - Best practice is a filter bar with clear “active filters” chips and one-click reset.
  - Keep the current filter state visible so users do not have to infer why a list is empty.

- [ ] Improve scan entry and post-scan feedback.
  - The scan flow should feel like the fastest path in the app.
  - Best practice is a large target, immediate confirmation, and a very clear result state after a QR scan.
  - If the scanned item is found, route the user directly to the relevant record with a success banner.

## Priority 4: Visual Design and Brand Polish

- [ ] Strengthen the visual hierarchy without over-styling.
  - The current UI is functional, but many surfaces have the same weight.
  - Best practice is to use a small number of elevation levels, stronger typographic scale, and one or two emphasis colors.
  - Reserve red for brand and critical states so it stays meaningful.

- [ ] Reduce the “all-white card” repetition.
  - Repeated white panels make the interface feel flat and generic.
  - Best practice is to vary section treatment subtly with background tone, borders, spacing, or card headers.
  - Add more breathing room between major regions and use visual landmarks more deliberately.

- [ ] Introduce a more intentional hero pattern on primary pages.
  - Dashboard and top-level modules would benefit from a stronger page intro area.
  - Best practice is a compact page header with title, purpose, and one or two primary actions.
  - Use the intro area to tell the user what matters on this page right now.

- [ ] Review typography scale and content density.
  - Some labels and descriptions are a little small or visually close to surrounding text.
  - Best practice is better spacing between headings, helper text, and body text so users can scan quickly.
  - Use sentence case for most UI labels unless there is a strong reason not to.

## Priority 5: Accessibility and Interaction Quality

- [ ] Verify contrast and focus states across all pages.
  - Best practice is strong visible focus indicators, especially for keyboard users.
  - Check text on subtle backgrounds, alert colors, and disabled states.

- [ ] Ensure touch targets are comfortably sized.
  - Best practice is a minimum usable tap target for buttons, row actions, and nav items.
  - This matters especially for staff using tablets or phones in the field.

- [ ] Add a skip-to-content link and stronger semantic landmarks.
  - Best practice for internal apps still includes fast keyboard navigation.
  - A skip link, clear main landmark, and predictable heading structure make the app easier to use.

- [ ] Improve consistency of success and error patterns.
  - Best practice is one system for banners, toasts, inline errors, and loading states.
  - Right now the copy and emphasis vary a bit from page to page.

## Priority 6: Product UX Improvements

- [ ] Add saved views or shortcuts for common operational tasks.
  - Best practice in admin tools is to reduce repeated filtering and searching.
  - Save common states like overdue maintenance, low stock, or active deployments.

- [ ] Make role differences clearer.
  - System admin and regular user experiences should feel intentionally different where needed.
  - Best practice is to keep admin actions discoverable but not noisy for normal users.

- [ ] Add lightweight onboarding for first-time use.
  - Best practice is a short “getting started” path when there is no data yet.
  - Explain the order of setup: locations, categories, assets, then maintenance and deployments.

- [ ] Review page-level terminology for plain language.
  - Keep wording consistent across modules.
  - Best practice is to use the terms staff already use in the field, not internal technical labels.

## Suggested Build Order

1. Responsive app shell and nav
2. Dashboard hierarchy and urgent-action surfacing
3. Form ergonomics and validation
4. Table/filter usability on desktop and mobile
5. Accessible states, confirmations, and feedback
6. Visual polish and onboarding refinements

## Notes

- This app is already solid on structure and consistency.
- The biggest UX gain now is not a redesign, but sharper hierarchy, better mobile handling, and faster paths to action.
- For this kind of operational tool, “clear, fast, and hard to misread” is the right bar.
