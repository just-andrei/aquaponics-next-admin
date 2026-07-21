# Next.js Admin Migration State

## Scope

- Project: `Hybrid Power-Driven Aquaponics with IoT Environmental Control System`
- App boundary: web administration only.
- The farmer/mobile app remains separate.
- ESP32 and other hardware behavior remains in firmware/hardware.
- This web app will only read and write stored Firebase data. It must not directly control hardware.

## Project Path

`C:\\flutterProjects\\aquaponics_application_1\\smart_aquaponics_next_admin`

The existing Flutter project at `C:\\flutterProjects\\aquaponics_application_1\\smart_aquaponics_web_application` is unchanged and remains the migration reference.

## Stack Used

- Next.js 16 with the App Router
- TypeScript
- Tailwind CSS 4
- Firebase JavaScript SDK (client setup for Auth and Firestore)
- Reusable React components under `src/components`

## Completed Setup

- Created a separate Next.js project with `src/` enabled.
- Created the `src/app`, `src/components`, `src/lib`, and `src/types` structure.
- Added `src/lib/firebase.ts`, which initializes Firebase Auth and Firestore from public environment variables.
- Added `.env.example`; local Firebase configuration belongs in the ignored `.env.local` file.
- Added placeholder routes: `/`, `/login`, `/admin/dashboard`, `/admin/growers`, `/admin/messages`, and `/admin/reports`.
- Added a small reusable admin shell and sidebar navigation.
- Migrated Firebase email/password sign-in, session observation, active-admin access checks, protected admin routes, and sign-out.
- Migrated the protected Grower Management list with live Firestore reads, search, and status filtering.
- Migrated the read-only Grower Details page and Assigned Systems list, including legacy field and collection-path compatibility.
- Migrated read-only Monitoring History inside each assigned-system card, including recent weekly summaries and display-only status classification.
- Migrated safe manual Environmental Alert Logging with unresolved-duplicate protection and status-only updates.
- Migrated Harvest Record Management inside assigned-system cards with manual add/edit forms and no delete action.
- Migrated Plant and Aquaculture Growth/Status History inside assigned-system cards with manual add/edit forms and no delete action.
- Migrated Admin Messages with protected contact/inquiry review tabs and manual status-only updates.
- Migrated read-only Hybrid Energy / Battery / Solar Backup Status display inside assigned-system cards.
- Replaced the former Monitoring Reports page with protected farmer System Issue Reports backed by `support_tickets` and `ticket_history`.
- Monitoring changes never write automatically; alert writes require an explicit admin button or status selection.
- No feature route communicates with hardware or sends ESP32 commands.
- No Firestore rules, collection names, or Flutter files were changed.

## Admin Authentication Migration

### Files Changed

- `src/lib/firebase.ts`
- `src/lib/auth.ts`
- `src/components/auth/AuthProvider.tsx`
- `src/components/auth/ProtectedAdminRoute.tsx`
- `src/components/admin/AdminSidebar.tsx`
- `src/app/layout.tsx`
- `src/app/login/page.tsx`
- `src/app/admin/layout.tsx`
- `src/app/admin/dashboard/page.tsx`
- Removed the superseded `src/components/admin-sidebar.tsx`

### Behavior Implemented

- `/login` signs in with Firebase email/password authentication.
- The app observes sessions with `onAuthStateChanged` and keeps a loading state until access is resolved.
- Every authenticated user is checked against `admin/{uid}` with `getDoc`.
- The admin document must exist. If a role marker is present, each marker must affirm admin access:
  - `role`, `userType`, or `type`: `admin` (the existing `manager` legacy admin role is also preserved)
  - `isAdmin`: `true`
- If an activity marker is present, each marker must affirm an active account:
  - `isActive`: `true`
  - `status`: `active`
- Missing, non-admin, inactive, or unverifiable accounts are signed out and shown a clear message.
- `/admin/*` is wrapped in a client-side guard, preventing protected content from rendering before the authorization check completes and redirecting unauthorized users to `/login`.
- Active administrators visiting `/login` are redirected to `/admin/dashboard`.
- The admin sidebar includes sign out.
- Firebase initialization is safe during static builds before `.env.local` exists; the login page explains when configuration is missing.

### Firestore Path Used

- `admin/{uid}` — read only for administrator authorization. No other Firestore data is read or written by this migration step.

### Verification

- `npm run lint` — passed.
- `npm run build` — passed; all requested routes were statically generated.

### Manual Test Steps After Adding `.env.local`

1. Start the app with `npm run dev` after adding the real `NEXT_PUBLIC_FIREBASE_*` values to `.env.local`.
2. Sign in with an active `admin/{uid}` account and confirm redirect to `/admin/dashboard`.
3. Open `/login` while that admin session is active and confirm redirect to `/admin/dashboard`.
4. Open an `/admin/*` URL while signed out and confirm redirect to `/login` without protected-content flash.
5. Sign in with a Firebase user that has no `admin/{uid}` document and confirm it is signed out with an administrator-access message.
6. Test an admin document with a non-admin role marker or inactive status and confirm it is signed out with the appropriate message.
7. Select `Sign out` in the sidebar and confirm redirect to `/login`; reopening an `/admin/*` URL should remain protected.

## Grower Management List Migration

### Files Changed

- `src/types/grower.ts`
- `src/lib/growers.ts`
- `src/components/growers/GrowerList.tsx`
- `src/app/admin/growers/page.tsx`
- `src/app/admin/growers/[growerUid]/page.tsx`
- `MIGRATION_STATE.md`

### Behavior Implemented

- `/admin/growers` subscribes to the existing grower collection in real time.
- The collection resolver checks `user` first and uses `users` only when the primary collection is empty, matching the existing Flutter compatibility pattern.
- Records with an empty role or the existing `grower`/`user` role are displayed; non-grower role records are excluded.
- Name compatibility supports `name`, `first_name`/`last_name`, and `firstName`/`lastName`.
- Status compatibility gives `isActive` priority, then normalizes `status`; missing status remains active to match the Flutter behavior.
- Created-date compatibility supports `createdAt` and `created_at`.
- The table shows name, email, status, address, created date, and a View Details action.
- Search filters by name and email without recreating the Firestore subscription.
- Status filtering supports All, Active, and Inactive.
- Loading, empty, no-results, and error/retry states are included.
- View Details links to the protected `/admin/growers/[growerUid]` route. The route now includes the grower profile, assigned systems, monitoring history, safe environmental alerts, harvest records, and plant/aquaculture growth-status history.

### Firestore Collections Used

- `user` — live primary grower collection, read only.
- `users` — existing compatibility fallback, read only and selected only when `user` is empty.

### Verification

- `npm run lint` — passed.
- `npm run build` — passed, including the dynamic `/admin/growers/[growerUid]` route.
- Live browser verification with an authenticated administrator is still pending.

### Manual Test Steps

1. Run `npm run dev`, sign in with an active administrator, and open `/admin/growers`.
2. Confirm existing `user` collection records appear with normalized name, email, status, address, and created date values.
3. Search with portions of a grower name and email and confirm the input remains focused while the table filters.
4. Select All, Active, and Inactive and confirm the expected rows are shown.
5. Confirm missing address or created-date fields display `Not available` without breaking the row.
6. Select View Details and confirm the protected `/admin/growers/[growerUid]` page opens for the selected document ID.
7. Sign out and confirm direct access to both grower routes redirects to `/login`.
8. If testing against a safe empty test collection or disconnected network, confirm the empty and error/retry states render clearly.

## Grower Details and Assigned Systems Migration

### Files Changed

- `src/types/grower.ts`
- `src/types/system.ts`
- `src/lib/growerDetails.ts`
- `src/components/growers/GrowerDetails.tsx`
- `src/components/growers/AssignedSystemsList.tsx`
- `src/app/admin/growers/[growerUid]/page.tsx`
- `MIGRATION_STATE.md`

### Behavior Implemented

- `/admin/growers/[growerUid]` reads the grower profile from `user/{growerUid}` and checks `users/{growerUid}` only when the primary document is missing.
- The profile displays compatible name, email, active/status, address, created date, and updated date fields.
- Assigned systems are read from `user/{growerUid}/systems`; `users/{growerUid}/systems` is used only when the primary systems collection has no results.
- System fields support the existing snake-case and camel-case variants for system name, hardware UID, active status, provision code, active fish ID, and active plant ID.
- Each system provides its stored monitoring summary to the nested Monitoring History section. Compatible sources include latest readings, latest monitoring, monitoring summaries, sensor averages, and root system fields.
- Stored pH, water temperature, dissolved oxygen, turbidity, and humidity values are shown when present. Status calculations remain display only and never write alerts or monitoring records.
- Loading, missing-grower, assigned-systems empty, error, retry, and Back to Growers states are included.
- Protection remains inherited from the existing `/admin` layout and active-admin route guard.
- This migration is read only and does not call Firestore write APIs.

### Firestore Paths Used

- `user/{growerUid}` — primary grower profile, read only.
- `users/{growerUid}` — grower profile fallback, read only and checked only if the primary document is missing.
- `user/{growerUid}/systems/{systemId}` — primary assigned systems, read only.
- `users/{growerUid}/systems/{systemId}` — assigned-systems fallback, read only and checked only if the primary systems collection is empty.

### Verification

- `npm run lint` — passed.
- `npm run build` — passed, including TypeScript validation and the dynamic `/admin/growers/[growerUid]` route.
- A source audit found no Firestore write APIs in the new Grower Details implementation.
- Live browser verification with an authenticated administrator and existing Firebase data is still pending.

### Manual Test Steps

1. Run `npm run dev`, sign in with an active administrator, open `/admin/growers`, and select View Details on a known grower.
2. Confirm name, email, status, address, created date, and updated date match `user/{growerUid}`.
3. Test a grower that exists only in `users/{growerUid}` and confirm the compatibility profile is displayed.
4. Confirm assigned systems from `user/{growerUid}/systems` display normalized names, identifiers, and active status.
5. Test a grower whose primary systems collection is empty but whose `users/{growerUid}/systems` collection has data, and confirm the fallback systems appear.
6. Confirm the Monitoring History section renders inside each assigned-system card and does not create a separate admin route.
7. Test a grower with no assigned systems and confirm the empty state appears.
8. Open an unknown grower UID or disconnect the network and confirm the error state, Retry action, and Back to Growers link work.
9. Sign out and confirm direct access to the details route redirects to `/login` without protected-content flash.

## Monitoring History Migration

### Files Changed

- `src/types/monitoring.ts`
- `src/types/system.ts`
- `src/lib/monitoring.ts`
- `src/lib/growerDetails.ts`
- `src/components/monitoring/MonitoringHistorySection.tsx`
- `src/components/monitoring/WeeklyLogsList.tsx`
- `src/components/growers/AssignedSystemsList.tsx`
- `src/components/growers/GrowerDetails.tsx`
- `MIGRATION_STATE.md`

### Behavior Implemented

- Monitoring History is nested inside every assigned-system card on `/admin/growers/[growerUid]`; no standalone Monitoring route or sidebar item was added.
- Latest stored monitoring supports `latest_reading`/`latestReading`, `latestMonitoring`/`latest_monitoring`, `monitoring_summary`/`monitoringSummary`, `sensor_averages`/`sensorAverages`, and compatible root fields.
- Nested `metrics`, `readings`, `sensors`, `averages`, and `data` maps are handled safely when present.
- Sensor aliases cover pH, water temperature, dissolved oxygen, turbidity, and humidity in existing snake-case and camelCase forms.
- Timestamp compatibility includes `timestamp`, `measuredAt`/`measured_at`, `updatedAt`/`updated_at`, `createdAt`/`created_at`, and `weekStart`/`week_start`.
- Missing values display `No data`; missing timestamps display `No timestamp`.
- Display status is classified as Normal, Warning, Critical, or No data using adjustable constants in `src/lib/monitoring.ts`.
- Starter normal ranges match the migrated Flutter display behavior: pH 6.5–8.0, water temperature 24–30 °C, dissolved oxygen at least 5 mg/L, turbidity at most 15, and humidity 45–80%. Wider warning boundaries determine Critical status.
- Up to five weekly logs are displayed newest first after normalizing compatible timestamp fields. Weekly notes and compatible stored health status are shown when sensor values are unavailable.
- Each weekly-log request uses the assigned system's already-selected `sourceCollection`. It never probes `users/{growerUid}` when the system came from `user/{growerUid}`, and uses `users` only when the existing assigned-system fallback selected it.
- Weekly-log loading, empty, error, and retry states are isolated per system card.
- Monitoring reads and display-status calculation remain read only. Manual alert actions are documented separately below; no automatic logging, monitoring writes, hardware controls, or ESP32 commands were added.

### Firestore Paths Used

- `user/{growerUid}/systems/{systemId}` — primary stored monitoring summary on the assigned-system document, read only.
- `user/{growerUid}/systems/{systemId}/weekly_logs/{logId}` — primary weekly monitoring history, read only.
- `users/{growerUid}/systems/{systemId}` — legacy system source only when the existing assigned-system fallback selected `users`, read only.
- `users/{growerUid}/systems/{systemId}/weekly_logs/{logId}` — legacy weekly history only for a system already loaded from `users`, read only.

### Verification

- `npm run lint` — passed.
- `npm run build` — passed, including TypeScript validation and the dynamic grower-details route.
- Live browser verification with authenticated admin access and representative monitoring documents is still pending.

### Manual Test Steps

1. Run `npm run dev`, sign in with an active administrator, and open a grower with assigned systems.
2. Confirm Monitoring History appears inside each system card and no Monitoring sidebar route exists.
3. Test system documents using `sensor_averages`, `latest_reading`, `latestMonitoring`, and `monitoring_summary` variants and confirm available values and timestamps render safely.
4. Confirm pH, temperature, dissolved oxygen, turbidity, and humidity show `No data` individually when missing.
5. Test values in normal, warning, and critical ranges and confirm monitoring changes alone create no alert or monitoring document without clicking Log Current Alerts.
6. Confirm weekly logs are loaded from the same `user` or `users` source selected for the assigned system and appear newest first.
7. Test weekly logs using snake-case and camelCase metric/timestamp fields, stored health status, notes, and missing values.
8. Test a system with no `weekly_logs` documents and confirm the empty state appears.
9. Disconnect the network or use an account without access and confirm the weekly error and Retry states remain scoped to that system card.
10. Sign out and confirm direct access to the grower-details route still redirects to `/login`.

## SAFE Environmental Alert Logging Migration

### Files Changed

- `src/types/alert.ts`
- `src/lib/environmentalAlerts.ts`
- `src/components/alerts/EnvironmentalAlertsSection.tsx`
- `src/components/monitoring/MonitoringHistorySection.tsx`
- `src/components/growers/AssignedSystemsList.tsx`
- `src/components/growers/GrowerDetails.tsx`
- `MIGRATION_STATE.md`

### Behavior Implemented

- Environmental Alerts remains inside Grower Management → Grower Details → Assigned Systems → Monitoring History. No Alerts route or sidebar item was added.
- Alert previews are generated in memory from the latest monitoring values already displayed for pH, water temperature, dissolved oxygen, turbidity, and humidity.
- Only Warning and Critical values produce previews. Normal or missing values show `No current warning/critical alerts` and no Log Current Alerts button.
- Preview calculation performs no Firestore writes and does not run from an effect or realtime listener.
- `Log Current Alerts` is the only create/new-cycle action. It writes to `environmental_alerts/{dedupeKey}` with source `web-monitoring-manual` only after the administrator clicks the button.
- Saved alerts for the current `growerUid` and `systemId` are loaded read only, sorted newest first, and displayed with their parameter, value, severity, message, status, and created timestamp.
- Administrators can update only the alert `status` through the UI: `new`, `acknowledged`, or `resolved`. No delete action exists.
- Status updates always set `updatedAt`; acknowledged sets `acknowledgedAt`, resolved sets `resolvedAt`, and returning to new clears both lifecycle timestamps.
- Existing Firestore rules were inspected and already allow admin read/create/update while denying delete for `environmental_alerts`; no rules change was made.

### Anti-Flooding Behavior

- Dedupe document IDs preserve the Flutter format: `growerUid_systemId_parameter_severity`.
- A Firestore transaction reads every target dedupe document before any write, making the unresolved-duplicate check atomic across concurrent admin clicks.
- Existing `new` and `acknowledged` documents are unresolved and skipped.
- An absent document or an existing `resolved` document can start a new alert cycle at the same dedupe path.
- A new cycle resets status to `new`, replaces `createdAt` and `updatedAt` with server timestamps, and clears `acknowledgedAt` and `resolvedAt`.
- Severity remains part of the key, so Warning and Critical conditions for the same parameter follow separate dedupe cycles, matching the existing Flutter logic.
- No writes occur from render, `useEffect`, monitoring changes, weekly-log loading, or saved-alert loading.

### Firestore Collection Used

- `environmental_alerts/{dedupeKey}` — manual alert create/new-cycle writes, saved-alert reads, and status-only updates.

Alert fields preserved:

- `growerUid`, `growerName`, `growerEmail`
- `systemId`, `systemName`, `hardwareUid`
- `parameter`, `value`, `severity`, `message`
- `status`, `source`, `dedupeKey`
- `createdAt`, `updatedAt`, `acknowledgedAt`, `resolvedAt`

### Verification

- `npm run lint` — passed.
- `npm run build` — passed, including TypeScript validation and the dynamic grower-details route.
- Source review confirmed that write functions are called only by the Log Current Alerts handler and explicit status-update handler.
- Live browser verification against representative alert documents is still pending.

### Manual Test Steps

1. Run `npm run dev`, sign in as an active administrator, and open a grower system with Normal monitoring values.
2. Confirm the preview empty state appears, the Log Current Alerts button is hidden, and no `environmental_alerts` document is created when monitoring data loads or changes.
3. Open a system with Warning or Critical values and confirm the preview parameter, value, severity, and message match the displayed latest monitoring summary.
4. Click Log Current Alerts once and confirm documents use the expected dedupe IDs, source `web-monitoring-manual`, status `new`, and server timestamps.
5. Click Log Current Alerts again while those alerts are new and confirm the result reports unresolved duplicates as skipped without creating another document.
6. Change an alert to acknowledged and confirm only status/lifecycle fields update and `acknowledgedAt` is populated.
7. Change it to resolved and confirm `resolvedAt` is populated; click Log Current Alerts again and confirm the resolved dedupe document starts a new cycle with fresh timestamps.
8. Change a saved alert back to new and confirm both lifecycle timestamps are cleared.
9. Confirm Saved Alerts loading, empty, error, and Retry states remain scoped to the current system.
10. Confirm there is no delete control, Alerts sidebar route, hardware action, pump/valve/feeding action, or ESP32 command.
11. Sign out and confirm the existing admin route guard still protects the grower-details page.

## Harvest Record Management Migration

### Files Changed

- `src/types/harvest.ts`
- `src/lib/harvestRecords.ts`
- `src/components/harvest/HarvestRecordForm.tsx`
- `src/components/harvest/HarvestRecordsSection.tsx`
- `src/components/growers/AssignedSystemsList.tsx`
- `MIGRATION_STATE.md`

### Behavior Implemented

- Harvest Records is rendered inside each assigned-system card on `/admin/growers/[growerUid]`; no Harvest route or sidebar item was added.
- Every section uses the assigned system's existing `sourceCollection`. Systems selected from `user` read and write only under `user`; systems selected by the compatibility fallback use only `users`.
- Records are loaded once and sorted newest first using each record's `harvestDate`, or that record's `createdAt` when `harvestDate` is unavailable.
- Existing camelCase fields are preserved, with safe snake_case read compatibility for legacy documents.
- The inline Add Harvest Record form supports `plant` and `aquaculture`, validates item name and quantity greater than zero, and preserves the Flutter options for units (`kg`, `g`, `pcs`, `bundles`) and conditions (`good`, `fair`, `poor`).
- Edit opens the same form with the selected record's values. Updates preserve `createdAt` and `createdBy` while refreshing the grower/system metadata and `updatedAt`.
- New records use an auto-generated Firestore document ID, set `createdAt` and `updatedAt` with server timestamps, and set `createdBy` to the authenticated administrator UID.
- Grower UID/name/email and system ID/name/hardware UID are populated from the protected grower-details context rather than entered manually.
- Loading, empty, error, retry, form validation, save success, and save error states are included per assigned system.
- Firestore writes happen only from explicit Add/Edit form submission. No write runs from render, `useEffect`, monitoring updates, or realtime listeners.
- No delete helper, delete button, hardware action, or ESP32 command was added.

### Firestore Paths Used

- `user/{growerUid}/systems/{systemId}/harvest_records/{recordId}` — primary selected-system path for reads and manual add/update writes.
- `users/{growerUid}/systems/{systemId}/harvest_records/{recordId}` — compatibility path only when the assigned system was already selected from `users`.

Fields preserved:

- `growerUid`, `growerName`, `growerEmail`
- `systemId`, `systemName`, `hardwareUid`
- `recordType`, `itemName`, `quantity`, `unit`
- `harvestDate`, `condition`, `notes`
- `createdAt`, `updatedAt`, `createdBy`

### Rule Coverage

- Existing rules already allow admin read/create/update for `harvest_records` under both `user` and `users` system paths.
- Existing rules explicitly deny harvest-record delete.
- No Firestore rules change was required or made.

### Verification

- `npm run lint` — passed.
- `npm run build` — passed, including TypeScript validation and the dynamic grower-details route.
- Source review confirmed there is no harvest delete operation and create/update helpers are called only by the manual form-submit handler.
- Live browser verification with authenticated admin access and representative harvest records is still pending.

### Manual Test Steps

1. Run `npm run dev`, sign in as an active administrator, and open a grower with an assigned system.
2. Confirm Harvest Records appears inside the system card and no Harvest sidebar route exists.
3. Confirm existing records display newest first using `harvestDate`, and that legacy records missing `harvestDate` use `createdAt` as their sort date.
4. Add a plant record and an aquaculture record; confirm all metadata fields, `createdBy`, and server timestamps are stored on the system's selected source path.
5. Submit an empty item name, zero/negative quantity, and invalid date and confirm validation prevents Firestore writes.
6. Edit a record and confirm editable fields and `updatedAt` change while `createdAt` and `createdBy` remain unchanged.
7. Test a grower whose assigned-system fallback selected `users` and confirm records read/write only under `users/{growerUid}/systems/{systemId}/harvest_records`.
8. Test a system with no harvest documents and confirm the empty state appears.
9. Disconnect the network or use an account without access and confirm load/save errors and Retry behave without losing the system context.
10. Confirm there is no delete control, automatic write, hardware action, or ESP32 command.
11. Sign out and confirm the existing admin route guard still protects the grower-details page.

## Plant and Aquaculture Growth/Status History Migration

### Files Changed

- `src/types/growthStatus.ts`
- `src/lib/growthStatusRecords.ts`
- `src/components/growth-status/GrowthStatusHistorySection.tsx`
- `src/components/growth-status/PlantStatusRecordsPanel.tsx`
- `src/components/growth-status/AquacultureStatusRecordsPanel.tsx`
- `src/components/growers/AssignedSystemsList.tsx`
- `MIGRATION_STATE.md`

### Behavior Implemented

- Growth / Status History is rendered inside every assigned-system card on `/admin/growers/[growerUid]`; no standalone route or sidebar item was added.
- Plant Status Records and Aquaculture Status Records use two compact tabs so the feature remains inside the existing system card without redesigning the admin shell.
- Each tab loads its records and sorts them newest first using that record's `recordedAt`, or its `createdAt` when `recordedAt` is unavailable.
- All reads and writes use the assigned system's already-selected `sourceCollection`. A system loaded from `user` stays under `user`; a compatibility system loaded from `users` stays under `users`. The implementation never probes or writes both paths.
- Existing camelCase fields are preserved on writes, with safe snake_case compatibility when reading existing records.
- Plant add/edit supports plant name, growth stage, optional height and unit, leaf condition, health status, notes, and recorded date.
- Aquaculture add/edit supports species, growth stage, optional fish count and average weight/unit, health status, feeding observation, behavior observation, notes, and recorded date.
- Empty optional numeric fields are saved as `null`. Non-empty height/weight values must be non-negative; fish count must be a non-negative whole number.
- Grower UID/name/email and system ID/name/hardware UID come from the protected grower/system context rather than administrator input.
- New records use auto-generated document IDs, server timestamps for `createdAt` and `updatedAt`, and the authenticated administrator UID for `createdBy`.
- Updates preserve the existing `createdAt` and `createdBy` fields while updating the editable status fields, contextual metadata, `recordedAt`, and `updatedAt`.
- Each tab includes loading, empty, error, Retry, validation, save-success, and save-error states.
- Firestore writes happen only from explicit Add/Edit form submission. No write runs during render, `useEffect`, record loading, monitoring changes, or realtime listeners.
- No delete helper, delete button, hardware action, or ESP32 command was added.

### Firestore Paths Used

- `user/{growerUid}/systems/{systemId}/plant_status_records/{recordId}`
- `user/{growerUid}/systems/{systemId}/aquaculture_status_records/{recordId}`
- `users/{growerUid}/systems/{systemId}/plant_status_records/{recordId}` - used only when the assigned system was already selected from `users`.
- `users/{growerUid}/systems/{systemId}/aquaculture_status_records/{recordId}` - used only when the assigned system was already selected from `users`.

Plant fields preserved:

- `growerUid`, `growerName`, `growerEmail`
- `systemId`, `systemName`, `hardwareUid`
- `plantName`, `growthStage`, `heightValue`, `heightUnit`
- `leafCondition`, `healthStatus`, `notes`, `recordedAt`
- `createdAt`, `updatedAt`, `createdBy`

Aquaculture fields preserved:

- `growerUid`, `growerName`, `growerEmail`
- `systemId`, `systemName`, `hardwareUid`
- `speciesName`, `growthStage`, `fishCount`
- `averageWeightValue`, `averageWeightUnit`, `healthStatus`
- `feedingObservation`, `behaviorObservation`, `notes`, `recordedAt`
- `createdAt`, `updatedAt`, `createdBy`

### Rule Coverage

- Existing rules already allow administrator read/create/update for both nested status-record collections under `user` and `users` system paths.
- Existing rules explicitly deny delete for both collections.
- No Firestore rules change was required or made.

### Verification

- `npm run lint` - passed.
- `npm run build` - passed, including TypeScript validation and the dynamic grower-details route.
- Source review confirmed there is no delete operation and create/update helpers are called only from the manual form-submit handlers.
- Firestore database edition was checked with the Firebase CLI and remains Standard / Firestore Native.
- Live browser verification with authenticated administrator access and representative status records is still pending.

### Manual Test Steps

1. Run `npm run dev`, sign in as an active administrator, and open a grower with an assigned system.
2. Confirm Growth / Status History appears inside the system card with Plant and Aquaculture tabs and no new sidebar route.
3. In Plant Status Records, add a record using each required field and confirm metadata, `createdBy`, timestamps, and the selected source path are correct.
4. Submit plant height empty, then with a valid number; confirm empty saves safely as `null` and invalid negative input is rejected.
5. Edit the plant record and confirm editable fields and `updatedAt` change while `createdAt` and `createdBy` remain unchanged.
6. In Aquaculture Status Records, add a record and confirm all observations and metadata are stored correctly.
7. Submit fish count and average weight empty, then with valid values; confirm empty fields do not crash and invalid negative/decimal fish counts are rejected.
8. Edit the aquaculture record and confirm the update preserves its creation metadata.
9. Confirm both lists display newest first by `recordedAt`, using `createdAt` only for legacy records without `recordedAt`.
10. Test a system selected from the `users` fallback and confirm both tabs read/write only under `users/{growerUid}/systems/{systemId}`.
11. Test systems with no records and a disconnected/unauthorized request; confirm empty, error, and Retry states work independently in each tab.
12. Confirm there is no delete control, automatic write, hardware action, ESP32 command, or separate Growth/Status page.
13. Sign out and confirm the existing admin route guard still protects the grower-details page.

## Admin Messages Migration

### Files Changed

- `src/types/message.ts`
- `src/lib/messages.ts`
- `src/components/messages/AdminMessagesPage.tsx`
- `src/components/messages/MessagesTable.tsx`
- `src/app/admin/messages/page.tsx`
- `MIGRATION_STATE.md`

### Behavior Implemented

- Replaced the `/admin/messages` placeholder with a real message-review page protected by the existing `/admin` layout and active-admin route guard.
- Added Contact Messages and Inquiry Messages tabs without adding a new route or redesigning the admin shell.
- Contact records load from `contact_submissions`; inquiry records load independently from `inquiry_submissions`.
- Records are sorted newest first by `createdAt`, with documents missing a valid timestamp placed last.
- Common fields safely support existing camelCase and snake_case variants for sender name, email, subject, message, status, creation timestamp, and source.
- Inquiry records additionally display contact number, company, location, inquiry type, farm size, setup location, budget range, and preferred setup date when available.
- Missing optional fields display a clear fallback or remain hidden without breaking the record card.
- Missing or unsupported status values normalize to `new`, matching the existing Flutter behavior.
- Administrators can manually update status only to `new`, `reviewed`, or `resolved`.
- The status update writes only the validated `status` field to the selected message document. It does not overwrite message content or submission metadata.
- Contact and inquiry tabs include independent loading, empty, filtered-empty, error, Retry, save-success, and save-error states.
- A simple All/New/Reviewed/Resolved filter is included for each active message collection.
- No create, delete, email-reply, notification, hardware, or ESP32 behavior was added.
- No write runs during render, `useEffect`, initial loading, retry, filtering, or tab changes.

### Firestore Collections Used

- `contact_submissions/{messageId}` - administrator reads and manual status-only updates.
- `inquiry_submissions/{messageId}` - administrator reads and manual status-only updates.

### Rule Coverage

- Existing rules already allow public create and administrator read/update for both message collections.
- Existing rules explicitly deny delete for both collections.
- No Firestore rules change was required or made.

### Verification

- `npm run lint` - passed.
- `npm run build` - passed, including TypeScript validation and the `/admin/messages` route.
- Source review confirmed the only Firestore mutation in the messages feature is `updateDoc(..., { status })`, called from the explicit status-selection handler.
- Firestore database edition was checked with the Firebase CLI and remains Standard / Firestore Native.
- Live browser verification with authenticated administrator access and representative submissions is still pending.

### Manual Test Steps

1. Run `npm run dev`, sign in as an active administrator, and open `/admin/messages`.
2. Confirm signed-out access redirects to `/login` without flashing message content.
3. Open Contact Messages and confirm `contact_submissions` records show newest first with name, email, subject, message, status, created date, and source.
4. Open Inquiry Messages and confirm `inquiry_submissions` records show the common fields plus all available inquiry-specific details.
5. Test documents with missing optional fields, missing status, snake_case aliases, and missing timestamps; confirm they render safely and missing status appears as `new`.
6. Use each status filter and confirm All/New/Reviewed/Resolved display the expected records.
7. Change a contact message through `new`, `reviewed`, and `resolved`; confirm only its Firestore `status` field changes.
8. Repeat the status update test for an inquiry message and confirm the other document fields remain unchanged.
9. Test empty collections and a disconnected or unauthorized request; confirm empty, error, and Retry states work for both tabs.
10. Confirm there is no delete control, reply-email action, automatic notification, automatic write, hardware action, or ESP32 command.

## Hybrid Energy / Battery / Solar Backup Status Display Migration

### Files Changed

- `src/types/energy.ts`
- `src/lib/energyStatus.ts`
- `src/components/energy/EnergyStatusSection.tsx`
- `src/components/growers/AssignedSystemsList.tsx`
- `MIGRATION_STATE.md`

### Behavior Implemented

- Added Energy / Power Status inside every assigned-system card on `/admin/growers/[growerUid]`; no Energy route or sidebar item was added.
- The section re-reads only the already-selected system document. Systems loaded from `user` read only from `user`; compatibility systems loaded from `users` read only from `users`.
- Existing Flutter code was inspected and contains capstone/landing references to hybrid solar backup, but no established `energy_logs` or `power_logs` read pattern. No new collection or compatibility collection was invented.
- Stored energy maps are normalized from `energy_status`/`energyStatus`, `power_status`/`powerStatus`, `battery_status`/`batteryStatus`, `solar_status`/`solarStatus`, `latest_energy`/`latestEnergy`, and `sensor_averages.energy`/`sensorAverages.energy`.
- Compatible root and nested aliases display current power source, battery percentage, battery voltage, solar voltage, charging status, load status, power status, backup availability, and the latest available timestamp.
- Current power source normalizes common grid/main values to `main_power`, solar values to `solar_backup`, battery values to `battery`, and missing/unrecognized values to `unknown`.
- Display-only status is Critical at battery percentage 20% or below, Warning at 40% or below, and Normal above 40%. A system with no recognized stored energy fields displays No data.
- Loading, No data, error, and Retry states are scoped to each assigned-system card.
- The section imports only the Firestore `getDoc` read API. It contains no create, update, delete, transaction, realtime-write, or automatic-switching behavior.
- No power-source, battery, solar, pump, relay, feeder, hardware, or ESP32 control was added.

### Firestore Paths and Fields Used

- `user/{growerUid}/systems/{systemId}` - primary selected system document, read only.
- `users/{growerUid}/systems/{systemId}` - read only when the existing assigned-system fallback already selected `users`.
- No `energy_logs`, `power_logs`, or other collection was created or queried.

Supported stored field families:

- `energy_status` / `energyStatus`
- `power_status` / `powerStatus`
- `battery_status` / `batteryStatus`
- `solar_status` / `solarStatus`
- `latest_energy` / `latestEnergy`
- `sensor_averages.energy` / `sensorAverages.energy`
- Snake_case and camelCase metric aliases for power source, battery percentage/voltage, solar voltage/charging, load status, backup availability, and timestamps.

### Verification

- `npm run lint` - passed.
- `npm run build` - passed, including TypeScript validation and the dynamic grower-details route.
- Source audit confirmed that the energy feature uses `getDoc` only and never imports a Firestore write API.
- Firestore database edition was checked with the Firebase CLI and remains Standard / Firestore Native.
- Existing Firestore rules and collection names were unchanged.
- Live browser verification with representative stored energy data is still pending.

### Manual Test Steps

1. Run `npm run dev`, sign in as an active administrator, and open a grower with assigned systems.
2. Confirm Energy / Power Status appears inside each system card and there is no Energy sidebar route.
3. Test a system using `energy_status` or `energyStatus` and confirm all available fields and timestamp display safely.
4. Test separate `power_status`, `battery_status`, and `solar_status` maps, including snake_case and camelCase aliases.
5. Test `latest_energy`/`latestEnergy` and `sensor_averages.energy`/`sensorAverages.energy` storage shapes.
6. Confirm battery values above 40% show Normal, values from 21% through 40% show Warning, and values at or below 20% show Critical.
7. Test a system with no recognized energy fields and confirm the No data state appears without errors.
8. Test a system selected through the `users` compatibility fallback and confirm the Retry/read path remains only `users/{growerUid}/systems/{systemId}`.
9. Disconnect the network or test an unauthorized request and confirm the error and Retry states remain scoped to that system.
10. Confirm loading, retry, and changing stored display data never writes a Firestore document or triggers hardware behavior.
11. Confirm there are no power switching, battery, solar, pump, relay, feeder, or ESP32 action buttons.
12. Sign out and confirm the existing admin route guard still protects the grower-details page.

## Previous Monitoring Reports Migration (Superseded)

> Historical note: this monitoring-analytics implementation was replaced on 2026-07-17 by the farmer System Issue Reports workflow documented at the end of this file.

### Files Changed

- `src/types/report.ts`
- `src/lib/reports.ts`
- `src/lib/energyStatus.ts`
- `src/components/reports/AdminReportsPage.tsx`
- `src/components/reports/ReportSummaryCards.tsx`
- `src/components/reports/RecentAlertsReport.tsx`
- `src/components/reports/RecentHarvestReport.tsx`
- `src/components/reports/RecentMonitoringReport.tsx`
- `src/app/admin/reports/page.tsx`
- `MIGRATION_STATE.md`

### Behavior Implemented

- Replaced the `/admin/reports` placeholder with a real Monitoring Reports page protected by the existing `/admin` layout and active-admin route guard.
- The page loads the primary `user` grower collection and uses `users` only when no valid primary grower records are available.
- For each grower, assigned systems are loaded from the grower's selected source. A primary grower with no `user/{uid}/systems` results may use the existing `users/{uid}/systems` compatibility fallback; nested histories stay on the selected system source.
- Summary cards show total, active, and inactive growers; total assigned systems; systems without stored monitoring; systems with stored hybrid-energy data; unresolved and resolved alert totals; and total harvest, plant-status, and aquaculture-status records.
- A system counts as having monitoring data when its system document contains a recognized monitoring summary or it has at least one `weekly_logs` document.
- Hybrid-energy presence reuses the existing safe energy-field normalizer and remains display/report logic only.
- Recent Alerts loads `environmental_alerts`, normalizes existing statuses, and displays the newest ten filtered records.
- Recent Harvest Records aggregates selected-system `harvest_records`, sorts by `harvestDate` with `createdAt` fallback, and displays the newest ten filtered records.
- Recent Weekly Monitoring aggregates selected-system `weekly_logs`, supports existing sensor/timestamp aliases, and displays the newest ten filtered records.
- Plant and aquaculture status subcollections are counted for summary cards without adding a separate report page or edit action.
- Grower, alert-status, start-date, and end-date filters apply to the recent activity sections. Summary cards remain complete totals and are labeled accordingly.
- Whole-page loading, empty activity sections, error, and Retry states are included.
- No PDF/export flow was added so the migration remains focused on the core read-only report page.
- The reports implementation imports Firestore `collection` and `getDocs` only. It has no create, update, delete, transaction, listener-driven write, or automatic-alert behavior.
- No hardware, power switching, pump, relay, feeder, or ESP32 action was added.

### Firestore Paths Used

- `user` - primary grower collection, read only.
- `users` - legacy grower fallback only when no valid primary growers are available.
- `user/{growerUid}/systems/{systemId}` - primary selected system documents, monitoring summary, activity, and stored-energy presence.
- `users/{growerUid}/systems/{systemId}` - compatibility system source only when the existing fallback selects it.
- `{selectedSource}/{growerUid}/systems/{systemId}/weekly_logs/{logId}` - recent monitoring history.
- `{selectedSource}/{growerUid}/systems/{systemId}/harvest_records/{recordId}` - harvest totals and recent harvests.
- `{selectedSource}/{growerUid}/systems/{systemId}/plant_status_records/{recordId}` - plant-status total.
- `{selectedSource}/{growerUid}/systems/{systemId}/aquaculture_status_records/{recordId}` - aquaculture-status total.
- `environmental_alerts/{alertId}` - alert totals and recent alerts.

### Verification

- `npm run lint` - passed.
- `npm run build` - passed, including TypeScript validation and the `/admin/reports` route.
- Source audit confirmed the reports feature uses read APIs only (`collection` and `getDocs`) and imports no Firestore write API.
- Firestore database edition was checked with the Firebase CLI and remains Standard / Firestore Native.
- Existing Firestore rules and collection names were unchanged.
- Live browser verification with representative cross-grower report data is still pending.

### Manual Test Steps

1. Run `npm run dev`, sign in as an active administrator, and open `/admin/reports`.
2. Confirm signed-out access redirects to `/login` without flashing report data.
3. Compare grower, active/inactive, assigned-system, alert, harvest, plant-status, and aquaculture-status summary totals with Firestore.
4. Confirm a system with neither a stored monitoring summary nor weekly logs increases Systems without monitoring; confirm a weekly log removes it from that count.
5. Confirm systems containing recognized stored energy fields increase Systems with energy data.
6. Confirm recent alerts appear newest first with grower, system, parameter, severity, status, message, and timestamp.
7. Confirm recent harvest records appear newest first using `harvestDate` and `createdAt` fallback.
8. Confirm recent weekly monitoring logs display compatible sensor values, status, notes, and timestamps safely.
9. Filter by grower and confirm all three recent sections show only that grower's records.
10. Filter alerts by new, acknowledged, and resolved and confirm only the Recent Alerts section changes.
11. Apply start and end dates and confirm records with missing/out-of-range timestamps are excluded while summary totals remain unchanged.
12. Clear filters and confirm all recent activity returns.
13. Test empty collections and disconnected/unauthorized requests and confirm the empty, error, and Retry states.
14. Test a safe dataset with no valid `user` growers and confirm the existing `users` fallback is used without cross-writing.
15. Confirm there are no edit, delete, export, hardware-control, automatic-alert, or ESP32 actions.

## Firestore Collections and Paths to Preserve

Top-level collection names:

- `admin/{uid}` — existing admin authorization records. Preserve current `role`, `status`, and `isActive` compatibility.
- `user/{uid}` — primary grower profile path.
- `users/{uid}` — legacy-compatible grower profile path.
- `plants/{id}` and `aquaculture/{id}`
- `support_tickets/{id}` and `ticket_history/{id}`
- `master_sets/{id}`
- `contact_submissions/{id}` and `inquiry_submissions/{id}`
- `environmental_alerts/{id}`
- `notifications/{id}` and `configuration/{id}`

Nested grower-system paths under both `user/{uid}` and `users/{uid}`:

- `systems/{systemId}`
- `systems/{systemId}/weekly_logs/{logId}`
- `systems/{systemId}/harvest_records/{recordId}`
- `systems/{systemId}/plant_status_records/{recordId}`
- `systems/{systemId}/aquaculture_status_records/{recordId}`

## Next Migration Steps

1. Complete the manual authentication and grower-list browser checks above.
2. Complete live browser checks for the migrated grower profile and assigned-systems views.
3. Complete live browser checks for Harvest Records and Plant/Aquaculture Growth/Status History.
4. Complete live browser checks for Admin Messages and its allowed status updates.
5. Complete live browser checks for the read-only energy display and the farmer System Issue Reports page.

## Explicit Non-Goals for This Step

- No Firestore rules changes.
- No changes to Firestore collection names; feature documents change only through explicit authorized actions.
- No changes to the Flutter project.
- No hardware commands, ESP32 controls, background alert loops, or automatic alert writes.
- No standalone Monitoring page or Monitoring sidebar item.
- No standalone Alerts page or Alerts sidebar item.
- No standalone Harvest page or Harvest sidebar item.
- No standalone Growth/Status page or Growth/Status sidebar item.
- No message deletion, email replies, or notification automation.
- No standalone Energy page, automatic power switching, or energy-related control actions.
- No report export/PDF generation. Issue-report writes occur only from explicit Create, Edit, or confirmed Resolve actions.

## Full-App Browser Testing and Stabilization Audit (2026-07-16)

### Audit Result

- Completed an unauthenticated browser audit in Microsoft Edge against the running Next.js development app at desktop and mobile viewport sizes.
- `/`, `/login`, `/admin/dashboard`, `/admin/growers`, `/admin/growers/[growerUid]`, `/admin/messages`, and `/admin/reports` completed without browser console or page runtime errors in the tested signed-out session.
- Every tested `/admin/*` URL redirected to `/login`. The protected page marker never appeared before redirect, and the auth-check screen did not remain stuck.
- The login form remained usable, rejected an empty submission with a clear validation message, and did not introduce horizontal overflow at desktop or 390 x 844 mobile size.
- Authenticated live-data browser testing remains pending because no administrator test credentials were supplied or stored in the project environment. The source, type, lint, build, empty-state, and write-boundary audits below were completed without bypassing Firebase authorization.

### Bugs Found and Fixed

- Fixed client Firebase initialization after server prerendering. `auth` and `db` are now initialized again after browser mount instead of leaving the auth provider indefinitely on `Checking administrator session...` when the module was first evaluated outside the browser.
- Added a fail-closed Firebase Authentication unavailable state so configuration or initialization failures show a clear error and never reveal protected content.
- Fixed nested Grower Details sidebar highlighting so `/admin/growers/[growerUid]` keeps Growers selected.
- Made recent harvest and weekly-monitoring React keys unique across growers to avoid duplicate-key runtime warnings when different growers use the same nested document ID.
- Removed stale scaffold/placeholder wording from the landing page and dashboard without changing their layout or functionality.

### Safety and Runtime Review

- The existing admin layout still wraps all `/admin/*` routes with `ProtectedAdminRoute`; protected children are not rendered until the Firebase Auth listener and `admin/{uid}` active-admin check finish.
- Grower list, Grower Details, Assigned Systems, Monitoring History, and Energy Status use Firestore read APIs only. System Issue Reports now has explicit manual create/edit/resolve handlers.
- Missing grower, missing systems, and empty monitoring, alerts, harvest, plant status, aquaculture status, energy, contact messages, inquiry messages, and report activity all have safe loading/empty/error handling. Applicable sections include Retry actions.
- Firestore writes are limited to explicit manual handlers: Log Current Alerts, alert status changes, harvest form submission, plant/aquaculture status form submission, message status changes, and issue report create/edit/resolve actions.
- No Firestore write is started from render, `useEffect`, monitoring changes, or a realtime listener.
- No delete Firestore API or delete control exists for alerts, harvest records, plant status records, aquaculture status records, or messages.
- No hardware-control implementation, ESP32 command, power-source switch, pump/valve/relay/feeder action, or automatic alert writer was found.
- Existing Firestore rules, collection names, and the Flutter project were not changed.

### Files Changed

- `src/lib/firebase.ts`
- `src/components/auth/AuthProvider.tsx`
- `src/components/admin/AdminSidebar.tsx`
- `src/components/reports/RecentHarvestReport.tsx`
- `src/components/reports/RecentMonitoringReport.tsx`
- `src/app/page.tsx`
- `src/app/admin/dashboard/page.tsx`
- `MIGRATION_STATE.md`

### Verification Results

- `npm run lint` - passed with zero errors or warnings after correcting the auth effect finding.
- `npm run build` - passed using Next.js 16.2.10, including TypeScript validation and generation of all eight application routes.
- The production build detected `.env.local`.
- Firestore remains Standard edition / Firestore Native. No database edition or rule change was made.

### Remaining Manual Authenticated Browser Test Checklist

1. Sign in with a valid active administrator and confirm `/login` redirects to `/admin/dashboard`; sign out and confirm every `/admin/*` route returns to `/login`.
2. Sign in with an inactive/non-admin account and confirm it is signed out with a clear denial message.
3. Open `/admin/growers` and verify live grower loading, name/email search, active/inactive filter, empty results, and View Details navigation.
4. Open an existing and a nonexistent `/admin/growers/[growerUid]`; verify profile fields, missing-grower handling, Back to Growers, no systems, and the selected `user` or legacy `users` source behavior.
5. For assigned systems, verify empty and populated Monitoring History/weekly logs, Environmental Alerts, Harvest Records, Plant Status, Aquaculture Status, and Energy Status sections plus their Retry behavior under an authorized network failure.
6. Verify alerts are created only after Log Current Alerts, unresolved duplicates are skipped, and only new/acknowledged/resolved status updates are available.
7. Verify harvest and plant/aquaculture records write only on Add/Edit form submission, validation rejects missing required fields, and no Delete action appears.
8. Open `/admin/messages` with empty and populated `contact_submissions` and `inquiry_submissions`; verify newest-first display, tabs, filters, Retry, allowed status updates, and absence of Delete/reply/automation controls.
9. Open `/admin/reports` with empty, partial, and representative farmer issue data; verify Active Issues/Resolved History, search, priority/category filters, Create/Edit validation, and the manual Resolve archive flow.
10. Recheck desktop and narrow mobile layouts after authenticated content loads, including long names, emails, messages, notes, and system identifiers.

## Admin Dashboard Overview Migration (2026-07-16)

### Files Changed

- `src/app/admin/dashboard/page.tsx`
- `src/components/dashboard/AdminDashboardOverview.tsx`
- `src/components/dashboard/DashboardSummaryCards.tsx`
- `src/components/dashboard/RecentAlerts.tsx`
- `src/components/dashboard/RecentMessages.tsx`
- `src/lib/dashboard.ts`
- `src/types/dashboard.ts`
- `MIGRATION_STATE.md`

### Behavior Implemented

- Replaced the dashboard information card with a useful read-only overview while retaining the existing `/admin` active-administrator route guard.
- Summary cards show total, active, and inactive growers; total assigned systems; unresolved and resolved environmental alerts; and new contact and inquiry message counts.
- Recent Environmental Alerts shows up to six saved alerts, newest first, with grower, system, parameter, value, severity, status, message, and timestamp when available.
- Recent Messages combines contact and inquiry submissions, sorts them newest first, and shows up to six records with their source type and status.
- Quick Actions link to Grower Management, Admin Messages, and System Issue Reports without adding a sidebar page.
- Whole-page loading and error states are included with a manual Retry action. Recent alerts and messages each provide a safe empty state.
- Unknown or missing alert/message statuses normalize safely to `new`; grower status supports `isActive`, `is_active`, and existing status strings.
- Grower totals prefer valid records in `user`. The `users` collection is loaded only when no valid primary growers are available.
- Assigned-system counts use the selected grower source and retain the established per-grower `users/{uid}/systems` fallback only when a primary `user/{uid}/systems` result is empty.
- The dashboard loader imports Firestore read APIs only (`collection`, `getDocs`, and `Timestamp`). It contains no create, update, delete, transaction, listener-triggered write, or automatic alert behavior.
- No hardware, power switching, pump, valve, relay, feeder, or ESP32 control was added.

### Firestore Collections and Paths Used

- `user` - primary grower collection, read only.
- `users` - legacy fallback only when there are no valid primary grower records, or for the established empty primary systems fallback.
- `{selectedSource}/{growerUid}/systems` - assigned-system count, read only.
- `environmental_alerts` - unresolved/resolved totals and recent saved alerts, read only.
- `contact_submissions` - new-contact total and recent combined messages, read only.
- `inquiry_submissions` - new-inquiry total and recent combined messages, read only.

### Verification Results

- `npm run lint` - passed with zero errors or warnings.
- `npm run build` - passed using Next.js 16.2.10, including TypeScript validation and static generation of `/admin/dashboard`.
- Source audit found no Firestore write API, delete API, hardware command, ESP32 command, or automatic write in the dashboard files.
- Firebase CLI confirmed the existing `(default)` Firestore Native database in `asia-east2`; no database, rule, or collection-name change was made.
- The Flutter project was not modified.

### Manual Test Steps

1. Run `npm run dev`, sign in as an active administrator, and open `/admin/dashboard`.
2. Confirm signed-out access to `/admin/dashboard` redirects to `/login` without flashing the overview.
3. Compare all eight dashboard totals with the existing Firestore documents.
4. Confirm valid `user` growers are preferred and `users` is used only under the documented compatibility fallback.
5. Confirm assigned-system totals use each grower's selected source and do not combine duplicate primary/legacy systems.
6. Confirm recent alerts and combined messages are newest first and limited to six visible records per section.
7. Test empty `environmental_alerts`, `contact_submissions`, and `inquiry_submissions` collections and confirm zero totals plus clear empty messages.
8. Test missing names, subjects, timestamps, statuses, and optional alert fields and confirm safe fallback text appears without a runtime error.
9. Disconnect the network or test an unauthorized read and confirm the error state and Retry Dashboard action.
10. Open Manage Growers, View Messages, and View Issue Reports and confirm each quick action goes to the existing protected route.
11. Confirm the dashboard offers no edit, status-update, delete, alert-log, hardware-control, or ESP32 action.

## Final Polish and Deployment Preparation (2026-07-16)

### Final Polish Result

- Audited every application route: `/`, `/login`, `/admin/dashboard`, `/admin/growers`, `/admin/growers/[growerUid]`, `/admin/messages`, and `/admin/reports`.
- Verified every hard-coded navigation target resolves to an existing route. Dynamic grower links continue to URL-encode the grower UID.
- No stale placeholder, coming-soon, TODO, scaffold, or not-implemented wording remains in the application UI. Historical migration notes and the Grower search input's HTML placeholder remain intentionally unchanged.
- Updated the landing description from future tense to current behavior.
- Kept the existing mobile horizontal admin navigation and added non-wrapping/shrink protection to its links.
- Made the desktop sidebar a flex column so its Sign out control can remain aligned after the navigation area.
- Enabled React strict mode explicitly in the otherwise minimal Next.js configuration.
- Removed the duplicate `.env.example` exception from `.gitignore`; `.env.local` remains protected by `.env*`.
- No new feature, sidebar route, PDF/export flow, Firestore collection, or Firestore rule was added.

### Route, Auth, and Responsive Audit

- A persistent Chrome browser audit at 390 x 844 covered `/`, `/login`, and every signed-out `/admin/*` route.
- All signed-out protected routes finished at `/login`, displayed the login form, never displayed their private page marker, did not remain on the administrator-access check, and produced no captured browser-console error.
- No tested route produced horizontal page overflow at the mobile viewport.
- Source review confirms `/admin/layout.tsx` continues to wrap every admin route in `ProtectedAdminRoute`, which renders protected children only for an active administrator.
- Source review confirms an authenticated active administrator visiting `/login` is redirected with `router.replace("/admin/dashboard")` after the AuthProvider check finishes.
- Active-admin redirect behavior and authenticated data-page layouts could not be browser-tested because no administrator test email/password is configured. They remain in the manual checklist below.
- Responsive source review found breakpoint grids, long-text wrapping, `min-w-0`, and table overflow protection across Dashboard, Growers, Grower Details, Messages, and Reports.

### Firestore and Safety Audit

- Read-only data libraries for Dashboard, Grower List, Grower Details, Monitoring History, and Energy Status contain no `addDoc`, `setDoc`, `updateDoc`, `deleteDoc`, `writeBatch`, or `runTransaction` API.
- All application write APIs remain limited to these explicit manual actions:
  - Log Current Alerts button.
  - Environmental alert status selection.
  - Harvest add/edit form submission.
  - Plant status add/edit form submission.
  - Aquaculture status add/edit form submission.
  - Message status selection.
  - Issue report create/edit submission.
  - Issue report Resolve action, which archives the full document in `ticket_history` before removing it from the active `support_tickets` queue in one batch.
- No allowed write helper is invoked from render, monitoring changes, or a realtime listener.
- No delete API or delete control exists for alerts, harvest records, plant status records, aquaculture status records, or messages.
- No hardware control, ESP32 command, relay control, pump control, valve control, feeder control, power switching control, or automatic alert writer exists in the Next.js source.
- Firebase CLI confirmed the existing `(default)` Firestore Native database in `asia-east2`. Firestore rules and collection names were unchanged.

### Loading and Empty-State Audit

- Dashboard, Grower List, Grower Details, Assigned Systems, Monitoring History, Environmental Alerts, Harvest Records, Plant Status, Aquaculture Status, Energy Status, Messages, and Reports expose safe loading and empty states.
- Data-loading modules expose an error state and applicable Retry action without writing Firestore data.
- Missing grower and missing assigned-system conditions remain explicit and do not crash nested sections.

### Files Changed

- `src/app/page.tsx`
- `src/components/admin/AdminSidebar.tsx`
- `next.config.ts`
- `.gitignore`
- `MIGRATION_STATE.md`

### Verification Results

- `npm run lint` - passed with zero errors or warnings.
- `npm run build` - passed using Next.js 16.2.10, including TypeScript validation and all application routes.
- Production smoke test: the built app started successfully with `next start` on an isolated port; `/`, `/login`, `/admin/dashboard`, `/admin/growers`, `/admin/messages`, and `/admin/reports` each returned HTTP 200. The temporary server was stopped after the test.
- The production build detected `.env.local`.
- All six required Firebase public configuration values are present in `.env.local` without being printed during verification.
- `.env.example` exists and `.gitignore` protects `.env.local` through `.env*`.
- The Next.js project still has no `.git` directory, so ignore protection was verified from the rule rather than a Git index.
- The existing Flutter project was not modified.

### Deployment Readiness Notes

- Core application code, static generation, TypeScript validation, production startup, Firebase initialization, signed-out route gating, and read/write boundaries are ready for capstone deployment testing.
- The deployment provider has not been selected or configured in this step; no hosting-specific file was invented.
- Copy the six `NEXT_PUBLIC_FIREBASE_*` values into the selected hosting provider's production environment. Do not upload or commit `.env.local`.
- Add the final deployed hostname to Firebase Authentication Authorized Domains when required by the chosen hosting domain and authentication configuration.
- Serve the deployed application over HTTPS and verify the existing Firestore admin-only rules in the production Firebase project before accepting real administration activity.
- Client route gating improves the interface, but Firestore security rules remain the authoritative data-access boundary.

### Remaining Manual Test Checklist

1. Sign in with a valid active administrator and confirm `/login` redirects to `/admin/dashboard` without a login-page flash.
2. Sign in with an inactive or non-admin account and confirm the account is signed out with a clear denial message.
3. At desktop, tablet, and mobile widths, use every sidebar link and Sign out while authenticated; verify the active label, horizontal mobile navigation, desktop sidebar alignment, and absence of clipped content.
4. Test Dashboard, Growers, Grower Details, Messages, and Reports with representative live data, empty collections, long text, missing optional fields, and authorized network failures.
5. Verify the selected `user`/`users` grower-system source behavior with real compatibility data and confirm no duplicate cross-source records appear.
6. Exercise each approved manual-write workflow once in a safe test record and confirm no write occurs before its button, select, or form submission.
7. Resolve an alert, log the same condition again later, and confirm the documented dedupe/new-cycle behavior.
8. Confirm no Delete or hardware-related action appears anywhere in the authenticated interface.
9. Configure the production environment variables and Firebase Authorized Domain, deploy to the selected provider, then repeat signed-out and active-admin route tests on the deployed HTTPS URL.
10. Verify the deployed project uses the intended Firebase project and existing production Firestore rules before final capstone demonstration.

## Admin UI/UX Polish (2026-07-16)

### UI/UX Polish Completed

- Completed a presentation-only polish pass across the existing protected admin application. Firebase initialization, authentication, route structure, data loaders, collection names, rules, and write handlers were not changed.
- Added a small reusable visual system for consistent status badges, summary cards, and loading/empty/error panels.
- Kept the admin design professional and restrained: neutral surfaces, plant-green success accents, cyan/blue monitoring accents, amber warnings, red critical states, and gray unknown/no-data states.
- Preserved all existing features and did not create or redesign the separate public landing page.

### Files Changed

- `src/app/globals.css`
- `src/app/admin/layout.tsx`
- `src/app/admin/dashboard/page.tsx`
- `src/app/admin/growers/page.tsx`
- `src/app/admin/growers/[growerUid]/page.tsx`
- `src/app/admin/messages/page.tsx`
- `src/app/admin/reports/page.tsx`
- `src/components/admin/AdminSidebar.tsx`
- `src/components/admin-page-header.tsx`
- `src/components/ui/StatusBadge.tsx`
- `src/components/ui/SummaryCard.tsx`
- `src/components/ui/StatePanel.tsx`
- `src/components/dashboard/AdminDashboardOverview.tsx`
- `src/components/dashboard/DashboardSummaryCards.tsx`
- `src/components/dashboard/RecentAlerts.tsx`
- `src/components/dashboard/RecentMessages.tsx`
- `src/components/growers/GrowerList.tsx`
- `src/components/growers/GrowerDetails.tsx`
- `src/components/growers/AssignedSystemsList.tsx`
- `src/components/monitoring/MonitoringHistorySection.tsx`
- `src/components/monitoring/WeeklyLogsList.tsx`
- `src/components/alerts/EnvironmentalAlertsSection.tsx`
- `src/components/harvest/HarvestRecordForm.tsx`
- `src/components/harvest/HarvestRecordsSection.tsx`
- `src/components/growth-status/GrowthStatusHistorySection.tsx`
- `src/components/growth-status/PlantStatusRecordsPanel.tsx`
- `src/components/growth-status/AquacultureStatusRecordsPanel.tsx`
- `src/components/energy/EnergyStatusSection.tsx`
- `src/components/messages/AdminMessagesPage.tsx`
- `src/components/messages/MessagesTable.tsx`
- `src/components/reports/AdminReportsPage.tsx`
- `src/components/reports/ReportSummaryCards.tsx`
- `src/components/reports/RecentAlertsReport.tsx`
- `src/components/reports/RecentHarvestReport.tsx`
- `src/components/reports/RecentMonitoringReport.tsx`
- `MIGRATION_STATE.md`

### Visual Improvements Made

- Admin shell: introduced a clearer aquaponics identity block, stronger active navigation state, compact responsive top navigation below the desktop breakpoint, sticky desktop sidebar, consistent focus indicators, and a restrained neutral/cyan page background.
- Page structure: standardized protected-page widths and responsive padding and strengthened page-title hierarchy without changing routes.
- Dashboard: standardized all summary cards with color-coded top accents and larger scan-friendly counts; improved quick actions, recent alerts, recent messages, and state panels.
- Grower Management: grouped search/filter controls, added a result-count capsule and visual Clear Filters action, improved row hover/readability, standardized account badges, and made View Details an obvious button-style link.
- Grower Details: improved Back navigation, profile hierarchy, metadata grouping, and active/inactive presentation.
- Assigned Systems: changed dense side-by-side cards to readable full-width system cards, added a clear system header, grouped identifiers, and retained every existing nested feature.
- Monitoring History: presented pH, water temperature, dissolved oxygen, turbidity, and humidity as distinct water-accent metric cards with the overall status meaning beside stored values; improved weekly summaries and No data states.
- Environmental Alerts: visually separated Alert Preview from Saved Alerts, kept Log Current Alerts clear but restrained, standardized severity/status badges, and improved status selection and state feedback.
- Harvest Records: improved add/edit form spacing, required-field hierarchy, validation messages, Save/Cancel placement, record cards, condition badges, and Edit affordance.
- Plant/Aquaculture History: clarified the two tabs with plant-green and water-cyan active states; improved forms, validation panels, actions, and record-card spacing while preserving health/growth badges.
- Energy Status: added a read-only battery percentage bar, grouped power/solar fields into clear metric cards, and standardized Normal/Warning/Critical/No data states.
- Messages: clarified Contact/Inquiry tabs, made status filters responsive, improved status badges and submission cards, and separated message content from metadata.
- Reports: replaced the monitoring-analytics presentation with responsive farmer issue-report summary cards, Active Issues/Resolved History tabs, filters, report cards, and explicit admin actions.
- Forms globally: improved field size, focus visibility, disabled appearance, required indicators, validation panels, and action-button consistency without changing submission logic.

### Safety Confirmation

- Read-only libraries for Dashboard, Grower List, Grower Details, Monitoring History, and Energy Status still contain no Firestore write API.
- Firestore mutation helpers are limited to explicit manual workflows: Log Current Alerts, alert status update, harvest add/edit, plant status add/edit, aquaculture status add/edit, message status update, and issue report create/edit/resolve.
- No write helper was added to render, monitoring changes, or a realtime listener.
- No standalone delete control exists. Resolving an issue report uses the preserved Flutter archive flow: copy to `ticket_history`, then remove the active `support_tickets` document in the same batch.
- No hardware, ESP32, relay, pump, valve, feeder, power-switching, or automatic-alert control was added.
- Firestore rules, collection names, Firebase logic, and the Flutter project were unchanged.
- Firebase CLI reconfirmed the existing `(default)` Firestore Native database in `asia-east2`.

### Verification Results

- `npm run lint` - passed with zero errors or warnings after the complete UI pass.
- `npm run build` - passed using Next.js 16.2.10, including TypeScript validation and all existing routes.
- Source write-boundary audit - passed; no new Firestore write API appeared in a read-only module.
- Authenticated visual browser testing remains manual because no administrator test credentials are stored in the project environment.

### Manual UI Test Checklist

1. Sign in with an active administrator and review all protected routes at approximately 1440 px desktop, 1024/768 px tablet, and 390 px mobile widths.
2. Confirm the desktop sidebar remains readable and sticky, the tablet/mobile navigation scrolls horizontally when needed, active-route highlighting is correct, and Sign out remains accessible.
3. Check keyboard Tab navigation and visible focus treatment for sidebar links, buttons, filters, selects, and form fields.
4. Dashboard: test large counts, zero counts, empty recent activity, loading, error, and Retry states; verify quick-action cards remain readable at all widths.
5. Growers: test long names/emails/addresses, search, status filtering, Clear Filters, no matches, empty collection, table horizontal scrolling, and View Details.
6. Grower Details: test missing profile fields, missing systems, multiple systems, long IDs, and every nested system section without clipped content.
7. Monitoring: compare Normal, Warning, Critical, and No data summaries and verify all five metric cards, timestamps, weekly logs, loading, empty, error, and Retry states.
8. Alerts: verify Preview and Saved Alerts are visually distinct; confirm no write occurs until Log Current Alerts or a status select is used and no Delete action appears.
9. Harvest: open Add and Edit forms, trigger validation errors, test long notes and each record type/unit/condition, and verify Save/Cancel placement on narrow screens.
10. Growth/Status: switch Plant/Aquaculture tabs, test both Add/Edit forms and validation states, and check health/growth/observation badges with long notes.
11. Energy: test missing data and representative battery values above 40%, from 21% to 40%, and at or below 20%; confirm the bar and status badge agree and no control button appears.
12. Messages: test both tabs, all status filters, empty/filtered-empty/error states, long submissions, inquiry details, and manual status updates without reply or Delete controls.
13. Issue Reports: test summary-card wrapping, Active Issues/Resolved History tabs, search, priority/category filters, empty states, Create/Edit forms, and the Resolve archive flow at desktop/tablet/mobile widths.
14. Confirm the public landing-page phase remains separate and that no new sidebar page, PDF/export action, hardware control, or automatic write was introduced.

## Admin UI/UX Refinement Follow-up (2026-07-16)

### Refinements Completed

- Replaced the always-expanded, horizontally scrolling tablet/mobile admin navigation with an accessible collapsible menu while preserving the sticky desktop sidebar and every existing route.
- Added `aria-expanded`, `aria-controls`, a clear open/close label, keyboard focus treatment, and automatic menu closing when an admin navigation link is selected.
- Added locale-aware number formatting and tabular numerals to the shared dashboard/report summary cards.
- Aligned semantic presentation colors without changing stored status values: inactive growers use neutral gray, reviewed messages use informational blue, and poor/critical plant or aquaculture health uses red.
- Added a visible `Status display only` cue to Energy / Power Status and a `Review details below` cue to each assigned system header. These are presentation-only labels and add no controls.
- Clarified the Harvest Record form submit actions as `Save record` and `Update record`.
- No landing page, route, Firebase configuration, authentication logic, collection/path compatibility, Firestore rule, or data operation was changed.

### Files Changed

- `src/components/admin/AdminSidebar.tsx`
- `src/components/ui/SummaryCard.tsx`
- `src/components/dashboard/DashboardSummaryCards.tsx`
- `src/components/dashboard/RecentMessages.tsx`
- `src/components/reports/ReportSummaryCards.tsx`
- `src/components/growers/GrowerList.tsx`
- `src/components/growers/GrowerDetails.tsx`
- `src/components/growers/AssignedSystemsList.tsx`
- `src/components/messages/MessagesTable.tsx`
- `src/components/growth-status/PlantStatusRecordsPanel.tsx`
- `src/components/growth-status/AquacultureStatusRecordsPanel.tsx`
- `src/components/energy/EnergyStatusSection.tsx`
- `src/components/harvest/HarvestRecordForm.tsx`
- `MIGRATION_STATE.md`

### Safety and Firebase Audit

- Read-only libraries for Dashboard, Grower List, Grower Details, Monitoring History, and Energy Status contain no `addDoc`, `setDoc`, `updateDoc`, `deleteDoc`, `writeBatch`, or `runTransaction` calls.
- Existing Firestore mutation helpers are limited to manual alert logging, alert status updates, harvest add/edit submission, plant/aquaculture status add/edit submission, message status updates, and issue report create/edit/resolve actions.
- `Log Current Alerts` remains an explicit button handler. Alert status changes remain explicit select actions. No alert write was added to render or `useEffect`, and the existing unresolved-duplicate transaction logic was not changed.
- No standalone delete control or ESP32, pump, relay, feeder, hardware-action, or power-switching control was found. Issue resolution alone performs the legacy archive-and-remove batch operation.
- Firebase CLI reconfirmed the configured `(default)` Firestore Native database in `asia-east2`; the CLI returned no explicit edition value, consistent with the existing Standard database setup.

### Verification Results

- `npm run lint` - passed with zero errors or warnings.
- `npm run build` - passed with Next.js 16.2.10, TypeScript validation, and all existing routes.
- The production build detected `.env.local`; no Firebase values were printed.
- Authenticated visual testing remains manual because administrator test credentials are not stored in the project.

### Remaining Manual Authenticated UI Checks

1. At desktop width, confirm the sticky sidebar remains visible and the current route is clearly highlighted.
2. At tablet and mobile widths, open and close the menu, follow every navigation link, confirm the menu closes after selection, and verify Sign out remains accessible.
3. Use keyboard Tab/Enter/Space navigation on the menu toggle, navigation links, form actions, filters, and selects; verify focus remains visible.
4. Review large dashboard/report counts and confirm locale separators do not clip or overflow their cards.
5. Verify inactive, reviewed, poor, and critical badges remain readable and match their displayed meaning with representative stored data.
6. Confirm every assigned system still shows Monitoring, Environmental Alerts, Harvest Records, Growth / Status History, and Energy / Power Status without requiring a route change.
7. Recheck the approved manual-write workflows with safe test records and confirm no write occurs until the corresponding button, select, or form is submitted.
8. Confirm the Energy / Power Status section remains display-only and that no delete, hardware-control, or automatic-write action appears anywhere.

## Public Website and Landing Hero LiquidEther (2026-07-16)

### Old Flutter References Inspected

- `lib/main.dart` - landing-page navigation, hero copy, system functions, feature/benefit sections, inquiry/contact calls to action, footer content, and the `image/aquaponics.png` hero asset.
- `lib/about.dart` - project overview, mission, vision, closed-loop aquaponics explanation, environmental parameters, and hybrid-energy context.
- `lib/contact.dart` - Contact Us fields, validation, explicit-submit behavior, success reset, and exact `contact_submissions` document shape.
- `lib/inquire.dart` - inquiry options, budget options, validation, setup fields, preferred date, explicit-submit behavior, success reset, and exact `inquiry_submissions` document shape.
- `lib/public_page_shell.dart` - public navigation, compact menu behavior, responsive content widths, and shared public-page presentation.
- `lib/login.dart` - public-to-admin navigation and administrator-only login messaging.
- `firestore.rules` - existing public create-only field allowlists and length/type requirements. Rules were inspected only and not modified.
- `PROJECT_STATE.md` and `CAPSTONE_REQUIREMENTS.md` - public content and web/mobile/hardware responsibility boundaries.
- `image/aquaponics.png` and `image/logo.png` - copied into the Next.js `public` directory as public-page assets; the originals were not changed.

### Public Pages Implemented

- Replaced the placeholder `/` page with a responsive public landing page containing a public header, hero, project overview, five main system functions, automatic-feeding and solar-backup information, how-the-system-helps steps, target users, contact/inquiry call to action, and footer.
- Added public `/contact` and `/inquiry` routes with accessible labels, required indicators, client-side validation, loading protection, success/error messages, and reset only after a successful submission.
- Added a shared responsive public header with Home, About anchor, Contact Us, Inquiry, Admin Login, keyboard focus states, and an accessible collapsible mobile menu.
- Kept `/login` authentication, `admin/{uid}` checks, active-admin checks, session restore, and redirects unchanged; only its presentation and public shell were aligned.
- A mobile-app download section was not invented because no supported APK/download asset or verified download link exists in the Flutter public implementation.

### Preserved Firestore Contracts

- Contact submissions use `contact_submissions` with `name`, `email`, `subject`, `message`, `createdAt`, `status: "new"`, and `source: "web"`.
- Inquiry submissions use `inquiry_submissions` with `name`, `email`, `contactNumber`, `companyName`, `location`, `inquiryType`, `farmSizeSqm`, `setupLocation`, `budgetRange`, `preferredSetupDate`, `message`, `createdAt`, `status: "new"`, and `source: "web"`.
- Both writes use the existing Firebase client initialization and collection constants. No duplicate Firebase app/configuration was created.
- Both writes run only inside explicit form-submit handlers. There are no submission writes in render, `useEffect`, listeners, timers, or background loops.
- The existing Admin Messages reader/status-update behavior was not modified.

### LiquidEther Hero Integration

- Integrated one React Bits LiquidEther instance only in the `/` landing-page hero as a transparent animated water layer behind the existing hero content.
- Installed runtime dependency `three` (`^0.185.1`) and development declarations `@types/three` (`^0.185.1`). No unrelated runtime dependency was installed.
- Used the official React Bits TypeScript/Tailwind source in `src/components/effects/LiquidEther.tsx`, marked as a Client Component. Its flexible internal shader/pass typing lint exceptions are scoped to that vendored file only.
- Added `ThemeAwareLiquidEther` with `next/dynamic` and `ssr: false`, preventing server evaluation of WebGL, `window`, `document`, observer, and pointer APIs.
- Added one shared persisted public theme provider and one header toggle because the inspected Next.js project had no existing theme provider/toggle. The theme is initialized before paint from `smart-aquaponics-theme` or the operating-system preference, avoiding a second LiquidEther-specific state.
- Light water palette: `#3B82F6`, `#06B6D4`, `#14B8A6` over a light slate/aqua hero background.
- Dark water palette: `#0369A1`, `#0891B2`, `#0F766E` over a dark navy hero background.
- Theme changes update the landing page, navigation, hero, content contrast, CTA styling, and LiquidEther palette without a page refresh.
- Theme changes remount the single keyed LiquidEther instance. Upstream cleanup cancels animation frames, disconnects ResizeObserver/IntersectionObserver, removes mouse/touch/visibility/resize listeners, disposes the renderer, releases the WebGL context, and removes the canvas.
- Performance settings use `resolution={0.4}`, capped renderer pixel ratio from the upstream component, visibility/intersection pausing, a single hero instance, calm auto speed/intensity, and resize throttling.
- `prefers-reduced-motion: reduce` skips LiquidEther WebGL entirely and uses a static theme-aware water-gradient background.
- The effect layer remains behind a readability overlay and relative `z-index` content; the upstream container is pointer-events none while its window-level coordinate handling preserves fluid response without blocking links/buttons.

### Files Created

- `public/aquaponics-hero.png`
- `public/aquaponics-logo.png`
- `src/app/contact/page.tsx`
- `src/app/inquiry/page.tsx`
- `src/components/effects/LiquidEther.tsx`
- `src/components/public/ContactForm.tsx`
- `src/components/public/FeatureCard.tsx`
- `src/components/public/InquiryForm.tsx`
- `src/components/public/PublicFooter.tsx`
- `src/components/public/PublicHeader.tsx`
- `src/components/public/PublicPageShell.tsx`
- `src/components/public/PublicThemeProvider.tsx`
- `src/components/public/ThemeAwareLiquidEther.tsx`
- `src/lib/publicSubmissions.ts`
- `src/types/publicSubmission.ts`

### Files Modified

- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/login/page.tsx` (presentation only)
- `package.json`
- `package-lock.json`
- `MIGRATION_STATE.md`

### Safety and Static Audit

- `/`, `/contact`, `/inquiry`, and `/login` are outside the protected admin layout and build as public routes.
- `/admin/*` remains wrapped by the existing `ProtectedAdminRoute`; the admin layout and route guard were not changed.
- LiquidEther is imported/rendered only by `src/app/page.tsx`; it is absent from Contact, Inquiry, Login, and all admin modules.
- No Firestore configuration, authentication behavior, rules, collection name, admin data operation, delete action, automatic write, or hardware/ESP32 control was changed or added.
- The old Flutter project was read and its two public assets were copied; no Flutter file was written or modified.

### Verification Results

- `npm run lint` - passed with zero errors or warnings.
- `npm run build` - passed with Next.js 16.2.10, TypeScript, `.env.local`, the new public routes, protected admin routes, and browser-only LiquidEther code safely isolated.
- Build route inventory includes public `/`, `/contact`, `/inquiry`, `/login` and the existing protected admin routes.
- `npm install` reported two moderate dependency advisories; no forced/breaking audit fix was applied during this scoped UI work.

### Remaining Manual Browser and Firebase Tests

1. Open `/` in Chrome/Edge with WebGL enabled and visually confirm the calm LiquidEther layer, readable hero content, clickable buttons, and exactly one hero canvas.
2. Toggle Light to Dark and back repeatedly; confirm the page/header/hero and water palette update without refresh and DevTools shows no duplicate canvas or obvious rising WebGL resource usage.
3. Test `prefers-reduced-motion: reduce`; confirm the static water background appears and no LiquidEther canvas is created.
4. Test the landing header, hero, sections, buttons, mobile menu, and effect sizing at approximately 1440 px, 1024/768 px, and 390 px widths with no horizontal overflow.
5. Verify `/contact` and `/inquiry` validation, duplicate-click prevention, friendly failure states, successful reset, and live writes with safe test submissions. Live Firebase submission testing was not performed in this implementation pass.
6. Confirm safe test submissions appear in Admin Messages with status `new` and all inquiry-specific fields displayed correctly.
7. Sign in with an active admin, inactive admin, and non-admin account to reconfirm login redirects and protected-route behavior. Authenticated browser testing remains manual because credentials are not stored in the project.
8. Revisit Contact, Inquiry, Login, Dashboard, and all `/admin/*` routes to confirm LiquidEther never appears outside the landing page.

## Full-Landing LiquidEther Background Adjustment (2026-07-16)

### Adjustment Completed

- Moved the existing single `ThemeAwareLiquidEther` render from the hero container into an optional landing-only background slot on `PublicPageShell`.
- The background now uses a fixed viewport layer (`fixed inset-0`, `h-dvh`, `z-0`) rather than a document-height canvas, so the same water effect remains behind the page while scrolling.
- Added a fixed theme-aware readability veil at `z-1`; the complete landing header, content, sections, CTA, and footer render inside one relative `z-10` content layer. The sticky public header retains `z-50`.
- Set the fixed WebGL background wrapper to `pointer-events-none`, ensuring the header, mobile menu, theme toggle, hero actions, Contact/Inquiry actions, and footer links always receive clicks.
- Preserved the existing light/dark palettes, `resolution={0.4}`, reduced-motion fallback, dynamic client-only loading, animation/observer cleanup, and renderer/WebGL disposal.

### Landing Surfaces Made Translucent

- Hero: light/dark slate surface at 65% opacity with minimal blur.
- About and Target Users: white/dark-navy surfaces at 75% opacity with backdrop blur.
- Main Functions: light/dark slate surface at 75% opacity with backdrop blur.
- Special Features: white/dark-navy surface at 80% opacity; important feature cards remain stronger for readability.
- How the System Helps: dark slate surface at 90% opacity so white text remains highly readable while water remains faintly visible.
- Contact/Inquiry CTA: emerald surface at 90% opacity.
- Landing header: white/dark-navy surface at 80% opacity with stronger backdrop blur.
- Landing footer: dark surface at 90% opacity with backdrop blur.

### Files Modified

- `src/app/page.tsx`
- `src/components/public/PublicPageShell.tsx`
- `src/components/public/PublicHeader.tsx`
- `src/components/public/PublicFooter.tsx`
- `MIGRATION_STATE.md`

### Scope and Safety Audit

- Static source audit confirms only one landing render of `ThemeAwareLiquidEther`: the `background` prop passed by `src/app/page.tsx`.
- `/contact`, `/inquiry`, `/login`, and every `/admin/*` route contain no LiquidEther import or render.
- Contact/Inquiry submission logic, Firebase configuration, Firebase Auth, Firestore, rules, collections, admin protection, admin UI, and the Flutter project were not modified.

### Verification Results

- `npm run lint` - passed with zero errors or warnings.
- `npm run build` - passed with Next.js 16.2.10, TypeScript validation, all public routes, and all existing admin routes.

### Remaining Manual Visual Tests

1. Scroll the full `/` page in light and dark themes and confirm the water remains subtly visible behind Hero, About, Main Functions, Special Features, How It Helps, Target Users, CTA, and near the footer.
2. In browser DevTools, confirm exactly one LiquidEther canvas exists before and after scrolling and repeated theme toggles.
3. Verify text contrast and CTA/header/footer click behavior at desktop, tablet, and mobile widths.
4. Confirm reduced-motion mode still renders the fixed static water treatment without a WebGL canvas.
5. Revisit `/contact`, `/inquiry`, `/login`, and `/admin/*` and confirm no LiquidEther background appears there.

## Landing Hero Image Removal and Liquid Visibility Polish (2026-07-16)

### Adjustment Completed

- Removed the aquaponics hero photo and its overlaid web-application-role card from the public landing page.
- Changed the hero from a two-column image layout to a single, wider copy layout while preserving its heading, description, focus chips, Learn More action, and Admin Login action.
- Increased LiquidEther visibility with more saturated theme-aware blue, cyan, and teal palettes, stronger automatic flow intensity, and stronger pointer response.
- Reduced only the landing readability veil and hero surface opacity so the water colors remain noticeable while content stays readable.
- Strengthened the reduced-motion static water fallback to match the updated contrast without enabling animation.

### Files Modified

- `src/app/page.tsx`
- `src/components/public/PublicPageShell.tsx`
- `src/components/public/ThemeAwareLiquidEther.tsx`
- `MIGRATION_STATE.md`

### Scope and Safety

- LiquidEther remains a single landing-page-only background and is not rendered on Contact, Inquiry, Login, or admin routes.
- The existing public theme toggle continues to control the shared page theme and water palette.
- Firebase, authentication, Firestore, collection names, admin routes, hardware behavior, and the Flutter project were not changed.

### Verification

- `npm run lint` - passed with zero errors or warnings.
- `npm run build` - passed with Next.js 16.2.10, TypeScript validation, and all existing public/admin routes.

### Remaining Manual Visual Tests

1. Confirm the hero has no photo and remains balanced at desktop, tablet, and mobile widths.
2. Confirm the water colors are clearly noticeable while all landing text and buttons remain readable in light and dark themes.
3. Confirm reduced-motion mode remains visible and creates no WebGL canvas.

## Landing LiquidEther Hydration Stabilization (2026-07-17)

### Issue

- React reported a hydration attribute mismatch in `ThemeAwareLiquidEther` after the reduced-motion fallback palette was changed while the development server was active.
- The server response contained the previous fallback class while the hydrated client bundle contained the updated fallback class.

### Fix

- Added a `useSyncExternalStore` hydration gate with deterministic server and hydration snapshots.
- The server and first client render now use the same neutral background element. LiquidEther or its reduced-motion static fallback is selected only after hydration completes.
- This avoids rendering browser preference-dependent visual markup during server rendering and does not suppress or hide genuine hydration warnings.
- Theme switching, reduced-motion support, the stronger water palette, and the single landing-only LiquidEther instance remain intact.

### Files Modified

- `src/components/public/ThemeAwareLiquidEther.tsx`
- `MIGRATION_STATE.md`

### Verification

- `npm run lint` - passed with zero errors or warnings.
- `npm run build` - passed with Next.js 16.2.10, TypeScript validation, and all existing public/admin routes.
- The stale pre-fix `npm run dev` process was stopped before the successful clean production build.

### Remaining Manual Check

1. Restart the development server, reload `/`, and confirm the console no longer reports a hydration mismatch.
2. Confirm animated water appears normally and reduced-motion mode still uses the static treatment.
3. Toggle light/dark theme and verify the matching palette appears without duplicate canvases.

## Safe Performance Optimization Pass (2026-07-17)

### Client Component Audit

- The project contains 24 explicit Client Components before and after this pass.
- Route: `src/app/login/page.tsx` requires form state, Firebase Auth actions, auth context, and navigation.
- Auth/navigation: `AdminSidebar`, `AuthProvider`, `ProtectedAdminRoute`, `PublicHeader`, and `PublicThemeProvider` require state, effects, router/path access, Firebase Auth, or interactive controls.
- Public interaction/effects: `ContactForm`, `InquiryForm`, `ThemeAwareLiquidEther`, and `LiquidEther` require form state, manual Firebase submits, media queries, browser APIs, or WebGL.
- Admin data/features: `EnvironmentalAlertsSection`, `AdminDashboardOverview`, `EnergyStatusSection`, `GrowerDetails`, `GrowerList`, `AquacultureStatusRecordsPanel`, `GrowthStatusHistorySection`, `PlantStatusRecordsPanel`, `HarvestRecordForm`, `HarvestRecordsSection`, `AdminMessagesPage`, `MessagesTable`, `MonitoringHistorySection`, and `AdminReportsPage` require client Firebase access, state, effects, filters, tabs, forms, or explicit manual actions.
- Every explicit Client Component still has a concrete browser/interactivity requirement; no directive was removed merely to reduce the count.
- The public landing page, its static content sections, `FeatureCard`, `PublicPageShell`, and `PublicFooter` were already Server Components and remain server-renderable. No static landing section required conversion.

### Provider Boundary Optimization

- Removed `AuthProvider` from the root layout, so `/`, `/contact`, and `/inquiry` no longer start the Firebase Auth listener or perform the `admin/{uid}` access check on page load.
- Scoped the unchanged `AuthProvider` to the existing `/admin/*` layout and a small `/login` layout. Login redirect behavior and protected admin gating remain unchanged.
- Moved `PublicThemeProvider` from the root layout into the server-rendered `PublicPageShell`, keeping public theme controls available while avoiding that client provider on admin-only screens.
- The root layout is now a Server Component without an application-wide client provider. Server-rendered children remain Server Components when passed through the small route-appropriate providers.
- The production `/page` client-reference manifest contains the public header, public theme provider, and theme-aware background island, but no `AuthProvider`, confirming the landing route no longer includes that auth boundary.

### LiquidEther Performance Changes

- Kept exactly one landing-page render of `ThemeAwareLiquidEther` and one `THREE.WebGLRenderer` construction path.
- Simulation resolution reduced from `0.4` to `0.3`.
- Poisson iterations reduced from `24` to `16`; viscosity remains disabled.
- Renderer DPR changed from a hard maximum of `2` to a configurable `maxDpr`, set to `1.5` for the desktop landing effect.
- Mobile/narrow/coarse-pointer/slow-update environments use the CSS water fallback and do not instantiate WebGL, so their effective WebGL DPR cost is zero.
- Disabled antialiasing for the full-screen decorative quad and requested the browser's low-power WebGL preference.
- Balanced animation activity: `autoIntensity` reduced from `2.2` to `1.6`, `autoSpeed` from `0.3` to `0.25`, and `mouseForce` from `20` to `14` while preserving the saturated theme palettes.

### Lightweight Fallback and Loading

- Added one reusable `public-water-fallback` CSS background with light aqua/blue/teal and dark navy/cyan/teal variants.
- The fallback renders during SSR/initial hydration and while the dynamically imported WebGL component loads, so landing content never depends on Three.js readiness.
- The fallback remains active for `prefers-reduced-motion: reduce` and for the capability/responsive query `(max-width: 767px), (pointer: coarse), (update: slow)`.
- The strategy uses responsive and input/update capabilities, not user-agent detection.
- Media-query changes are subscribed to safely, allowing cleanup and a switch between fallback/WebGL if device conditions change.

### Cleanup and Loop Audit

- Preserved the single requestAnimationFrame loop, document-visibility pause, IntersectionObserver pause/resume, ResizeObserver sizing, renderer disposal, canvas removal, and forced WebGL context loss.
- Removed the redundant window `resize` listener because the existing ResizeObserver already owns container resize updates.
- Added cleanup for the pending resize animation frame and the pointer inactivity timeout.
- Static source audit confirms one `ThemeAwareLiquidEther` render in `src/app/page.tsx` and one `new THREE.WebGLRenderer` construction in `LiquidEther.tsx`.
- Browser DevTools is still required to confirm runtime canvas/loop counts across route changes and repeated theme toggles.

### Files Modified or Added

- `src/app/layout.tsx`
- `src/app/admin/layout.tsx`
- `src/app/login/layout.tsx` (added)
- `src/app/globals.css`
- `src/components/public/PublicPageShell.tsx`
- `src/components/public/ThemeAwareLiquidEther.tsx`
- `src/components/effects/LiquidEther.tsx`
- `MIGRATION_STATE.md`

### Safety Audit

- Firebase configuration, Auth implementation, Firestore rules, collections, paths, public submission behavior, environmental alerts, admin feature logic, and route protection were not changed.
- No backend, API project, Firebase Admin SDK, database, authentication system, hardware control, ESP32 command, automatic write, or working feature was added or removed.
- The old Flutter project was not modified.

### Verification

- `npm run lint` - passed with zero errors or warnings.
- `npm run build` - passed with Next.js 16.2.10, TypeScript validation, and all existing public/admin routes.

### Remaining Manual Performance Tests

1. On desktop, load `/` and confirm the saturated LiquidEther background appears after the immediate CSS fallback without a visible blank state.
2. In DevTools, confirm exactly one canvas and one active animation loop, including after repeated theme toggles and navigation away from/back to `/`.
3. Use mobile emulation and a real phone/tablet to confirm the CSS fallback appears and no WebGL canvas/context is created.
4. Enable reduced motion and confirm the CSS fallback remains with no WebGL canvas.
5. Confirm the animation pauses in a hidden tab and cleanup removes the canvas/context/listeners when leaving `/`.
6. Compare Performance, GPU, memory, and battery/CPU profiles before and after at desktop DPR 1, 1.5, and higher-density displays.
7. Recheck Contact, Inquiry, Login, active/non-admin redirects, protected admin routes, and all existing admin features with real Firebase credentials/data.
8. Confirm there are no hydration or browser console errors after a clean development-server restart.

## Final Runtime QA and Performance Verification (2026-07-17)

### Production-Mode Verification

- `npm run lint` passed before runtime testing.
- `npm run build` passed and generated all existing public and admin routes.
- Port 3000 was already occupied, so the verified production build was started in isolation with `npm run start -- -p 3100`.
- Next.js 16.2.10 reported ready in approximately 1.9 seconds, and `http://127.0.0.1:3100/` returned HTTP 200.
- Runtime checks used installed Chrome 150 in headless mode through the Chrome DevTools Protocol with a new temporary browser profile. No browser-testing dependency was installed.

### Landing Page Runtime Findings

- `/` loaded with the correct title, public header, hero heading, full landing content, CTA links, and footer.
- Full-page production screenshots were inspected in both light and dark themes; content remained readable from the hero through the footer.
- The page scroll height exceeded four viewport heights, and scrolling to the bottom retained exactly one canvas.
- The fixed background reported `pointer-events: none`, while navigation, theme, Contact, Inquiry, Learn More, and Admin Login links remained present and reachable.
- No hydration mismatch, React warning, unhandled exception, WebGL error, ResizeObserver error, or duplicate-key warning appeared after the final fixes.

### LiquidEther Canvas and Lifecycle Verification

- Capable desktop viewport: one canvas, one created WebGL context, and one steady pending animation frame.
- Six consecutive light/dark theme switches retained one canvas, one WebGL context, and one steady animation frame.
- Scrolling retained one canvas and one steady animation frame.
- When another browser target became active, the landing document reported `hidden: true` and pending RAF work dropped from one to zero.
- After reactivating the landing target, it reported `hidden: false`, retained one canvas, and resumed to one pending RAF.
- No duplicate canvas, accumulated animation loop, or resume-loop multiplication was observed.

### Confirmed Issues and Fixes

- Initial runtime instrumentation found that every theme switch destroyed and recreated the WebGL context. Six switches increased total created contexts from one to seven even though active canvas count remained one.
- Initial runtime console capture also found one `THREE.Clock` deprecation warning per renderer initialization.
- Removed the theme-key remount and added in-place palette texture updates, allowing light/dark colors to change without recreating the renderer.
- Replaced deprecated `THREE.Clock` with `THREE.Timer`, resetting the timer when the loop starts and disposing it during cleanup.
- Added explicit palette texture disposal while preserving renderer, canvas, observer, RAF, listener, timeout, and context cleanup.
- Post-fix runtime verification kept total created WebGL contexts at one through all six theme switches and produced an empty console finding list.

### Responsive and Reduced-Motion Findings

- Mobile 390x844: zero canvases, zero WebGL contexts, one CSS water fallback, no horizontal overflow, and successful light/dark fallback palette change.
- Touch tablet 768x1024: zero canvases, one CSS fallback, coarse-pointer fallback active, and no horizontal overflow.
- Desktop with `prefers-reduced-motion: reduce`: zero canvases, zero WebGL contexts, and one CSS fallback.
- Mobile, tablet, and reduced-motion console captures were empty.

### Public Authentication Boundary Verification

- Production client-reference manifests for `/`, `/contact`, and `/inquiry` do not contain `AuthProvider`.
- Production client-reference manifests for `/login` and `/admin/dashboard` do contain `AuthProvider`.
- A clean unauthenticated browser profile opening `/admin/dashboard` was redirected to `/login` and received the administrator sign-in screen.
- Static inspection confirms `ProtectedAdminRoute` still blocks while auth/admin validation is loading or inactive, and `AuthProvider` still calls `getAdminAccess` for the active-admin check.
- Active-admin and inactive/non-admin credential paths were not tested because no credentials were used or stored.

### Contact and Inquiry Runtime Verification

- `/contact` and `/inquiry` loaded their forms with no LiquidEther canvas and no console findings.
- Both pages rejected an intentionally invalid email, displayed the correct field error and summary alert, and did not enter a submitting state or reach a Firestore write.
- Static inspection confirms both handlers return during validation failure, guard against `isSubmitting`, disable fields/buttons while submitting, and call their Firestore helper only after explicit valid form submission.
- Valid live submissions and rapid duplicate clicks during a real network write were intentionally not performed to avoid adding production Firestore documents.

### Public Bundle and Performance Findings

- The landing production manifest contains only the required public client islands and does not include the admin `AuthProvider`.
- Source/runtime instrumentation confirms one renderer construction path and one active instance.
- Visibility pause/resume, ResizeObserver, IntersectionObserver, pending resize RAF cleanup, pointer timeout cleanup, listener removal, palette disposal, timer disposal, canvas removal, renderer disposal, and forced context loss are present.
- No additional performance defect was confirmed after the theme-remount and timer fixes.

### Files Modified

- `src/components/effects/LiquidEther.tsx`
- `src/components/public/ThemeAwareLiquidEther.tsx`
- `MIGRATION_STATE.md`

### Final Verification Results

- `npm run lint` - passed with zero errors or warnings after the fixes.
- `npm run build` - passed with Next.js 16.2.10, TypeScript validation, and all existing routes after the fixes.
- Post-fix production server start - passed on isolated port 3100.
- Post-fix browser console findings - none across landing desktop/mobile/tablet/reduced-motion, Contact, Inquiry, Login, and unauthenticated admin redirect scenarios.

### Remaining Manual Tests

1. Sign in with a real active admin and confirm `/login` redirects to `/admin/dashboard`, authenticated admin navigation works, and logout returns to `/login`.
2. Sign in with an inactive or non-admin account and confirm the existing denial/sign-out message.
3. Perform one intentional Contact and one Inquiry submission using agreed test data, confirm the loading/disabled state during the real network write, and verify exactly one document appears in each existing collection.
4. On physical desktop/mobile hardware, compare Chrome Performance, memory, GPU, CPU, and battery profiles over an extended session; headless Chrome verifies lifecycle behavior but not real-device thermals or subjective smoothness.
5. Test tab hiding/resume repeatedly in the user's normal visible browser and confirm no long-session performance drift.

## Public About Navigation Active State (2026-07-17)

- Updated the public header to track URL hash changes without making the landing page a Client Component.
- Selecting About (`/#about`) now gives About the stronger emerald active treatment and removes the active treatment from Home.
- Returning to `/` restores Home as the active navigation item.
- No route, Firebase, admin, form, LiquidEther, or Flutter behavior was changed.
- `npm run lint` passed, and `tsc --noEmit` passed without disturbing the active development server.

## Public Header Simplification (2026-07-17)

- Removed the About navigation button from the top public navigation.
- Removed the logo image from the top public header.
- Changed the top header brand text from `Smart Aquaponics` to `Aquaponics`.
- Removed the no-longer-needed URL hash subscription from `PublicHeader`.
- Footer branding, landing content, routes, Firebase, admin behavior, LiquidEther, and the Flutter project were not changed.
- Targeted ESLint for `PublicHeader.tsx` passed, and `tsc --noEmit` passed.

## Farmer System Issue Reports Rewrite (2026-07-17)

### Flutter Contract Preserved

- Replaced the monitoring-analytics content at `/admin/reports` with the farmer issue-report workflow from Flutter `SupportTicketsView`.
- Active farmer reports use `support_tickets`; resolved reports use `ticket_history`; grower identity uses `user`, with `users` only as the existing empty-primary compatibility fallback.
- Ticket display prefers `ticketNumber` and safely falls back to legacy `ticket_id` without changing existing document IDs.
- Existing numeric/string `user_id`, optional `user_uid`, `reported_by`, `email`, `subject`, snake_case, and camelCase values are normalized safely for display.
- Categories remain `Sensor`, `Actuator`, `Fish`, and `Plant`. Priorities remain `Urgent` and `Normal`. Active and resolved statuses remain `Open` and `Resolved`.

### Behavior Implemented

- Added real-time Active Issues and Resolved History tabs so new farmer reports and admin changes appear without a page reload.
- Added separate search/filter state for each tab, including ticket/grower/title/email search plus Priority and Category filters.
- Added responsive issue cards showing ticket number, title/subject, description, priority, status, category, reporter, grower user ID, email when stored, reported timestamp, and resolved timestamp for history.
- Kept the issue summary focused on two counts only: Unresolved Issues and Resolved Issues.
- Added explicit admin Create and Edit forms with required validation and grower selection.
- Admin-created ticket numbers are reserved transactionally through the existing `configuration/support_ticket_counter` document. Timestamp-like legacy `ticket_id` values are not treated as clean sequential counters.
- Resolve requires explicit confirmation and runs as a Firestore transaction: the latest active document is copied to `ticket_history/{id}` with resolution/archive metadata, then the matching `support_tickets/{id}` source is removed.
- History remains read-only. There is no standalone Delete or Reopen control.
- Added loading, empty, filtered-empty, error, retry, refresh, success, and failure feedback states.
- Added modal focus entry/trapping/restoration and complete tab/tabpanel keyboard semantics.

### Files Changed

- `src/app/admin/reports/page.tsx`
- `src/components/reports/AdminReportsPage.tsx`
- `src/components/reports/IssueReportCard.tsx` (added)
- `src/components/reports/IssueReportFormDialog.tsx` (added)
- `src/components/reports/IssueReportSummaryCards.tsx` (added)
- `src/lib/issueReports.ts` (added)
- `src/types/issueReport.ts` (added)
- `src/components/admin/AdminSidebar.tsx`
- `src/components/dashboard/AdminDashboardOverview.tsx`
- `src/lib/dashboard.ts`
- `src/types/dashboard.ts`
- `MIGRATION_STATE.md`

### Firestore Paths Used

- `support_tickets/{ticketId}` - real-time active reads, manual create/update, and confirmed resolution source.
- `ticket_history/{ticketId}` - real-time resolved-history reads and confirmed resolution archive destination.
- `user/{growerUid}` - primary grower identity lookup.
- `users/{growerUid}` - compatibility lookup only when the primary grower collection is empty.
- `configuration/support_ticket_counter` - existing-collection admin-only counter used to reserve unique sequential numbers for admin-created reports.

### Safety

- Firestore writes occur only after Create form submission, Edit form submission, or a confirmed Resolve action.
- No write occurs from render, filtering, loading, effects, or real-time listeners.
- Resolve has no destructive standalone action: the active source is removed only inside the same transaction that archives its latest data to history.
- No Firestore collection name or rule was changed.
- No hardware, ESP32, pump, valve, relay, feeder, or power-switching action was added.
- The Flutter reference project was inspected only and was not modified.

### Verification

- Firebase CLI confirmed `(default)` is a Standard-edition Firestore Native database in `asia-east2`.
- `tsc --noEmit --incremental false` - passed.
- `npm run lint` - passed with zero errors or warnings.
- `npm run build` - passed with Next.js 16.2.10, TypeScript validation, `.env.local` detection, and successful generation of `/admin/reports` plus all existing routes.

### Remaining Manual Browser Test Checklist

1. Sign in as an active administrator and confirm `/admin/reports` is protected and the sidebar highlights Issue Reports.
2. Verify empty and populated Active Issues and Resolved History states against live `support_tickets` and `ticket_history` data.
3. Add a safe farmer test report and confirm it appears automatically through the real-time listener.
4. Test ticket/grower/title/email search and all Priority/Category filters independently on both tabs.
5. Create and edit one safe admin test report; confirm validation, grower selection, sequential display number, success feedback, and stored fields.
6. Resolve a safe test report; confirm the same document ID appears in `ticket_history`, resolution metadata exists, and the active source disappears only after the archive succeeds.
7. Test long titles, descriptions, names, and emails at desktop, tablet, and mobile widths.
8. Test modal keyboard focus, Escape, Tab/Shift+Tab containment, tab arrow keys, error/retry handling, and signed-out redirection.
9. Confirm no standalone Delete, Reopen, hardware, or ESP32 action appears.

## Grower Account Add and Delete (2026-07-17)

### Implemented Locally

- Added an `Add new grower` action to `/admin/growers` with a focused modal for first name, last name, email, phone number, and address.
- New accounts preserve the existing Flutter/Firebase profile contract: `user_id`, `first_name`, `last_name`, `name`, normalized `email`, `phone_num`, `address`, `role: grower`, `status: active`, `isActive: true`, and snake_case/camelCase server timestamps.
- Added a per-row `Delete` action with an explicit warning and a required exact `DELETE` confirmation.
- Add/delete progress, validation, backend errors, success feedback, keyboard Escape behavior, focus containment, and focus restoration are included.
- The grower list remains real time, so successfully created or deleted rows update through the existing listener.

### Protected Backend

- Added callable Cloud Functions `createGrowerAccount` and `deleteGrowerAccount` in the new Next.js project only.
- Both functions require Firebase Authentication and independently verify that `admin/{callerUid}` is an active administrator using the same compatible role/type/isAdmin and status/isActive markers as the web route gate.
- Creation uses the Admin SDK, so the current administrator session is never replaced by the new grower session.
- A transaction reserves the next numeric `user_id` through `configuration/grower_user_counter` and creates the profile. If profile creation fails, the new Auth account is rolled back.
- After successful creation, the browser requests a Firebase password-reset email. Email failure is reported as a warning without deleting an otherwise valid account.
- Deletion rejects the current caller, rejects any target with `admin/{targetUid}`, verifies the target grower profile, deletes the Auth account, then uses Admin SDK recursive deletion for the selected `user/{uid}` or `users/{uid}` path.
- The recursive account deletion includes assigned systems and every nested collection, including weekly logs, harvest records, plant status records, and aquaculture status records.
- `environmental_alerts`, `support_tickets`, and `ticket_history` remain retained as administrative audit records; the confirmation dialog states this explicitly.
- No Firestore rule or collection name was changed. The old Flutter project was inspected only and was not edited.

### Files Added or Changed

- `.firebaserc` (added)
- `firebase.json` (added; Functions codebase only)
- `.gitignore`
- `functions/package.json` (added)
- `functions/package-lock.json` (added)
- `functions/index.js` (added)
- `src/types/grower.ts`
- `src/lib/growerAccounts.ts` (added)
- `src/components/growers/GrowerFormDialog.tsx` (added)
- `src/components/growers/DeleteGrowerDialog.tsx` (added)
- `src/components/growers/GrowerList.tsx`
- `MIGRATION_STATE.md`

### Firebase Paths Used

- `admin/{callerUid}` - server-side active-admin authorization.
- `admin/{targetUid}` - prevents deleting an administrator through Grower Management.
- `user/{growerUid}` - primary grower account profile and recursive nested-data target.
- `users/{growerUid}` - used only when the existing list selected the legacy source.
- `configuration/grower_user_counter` - transactional numeric grower ID allocation.
- Firebase Authentication - manual account create/delete and password-reset email.

### Verification

- Firebase CLI 15.24.0 confirmed the intended project currently has no deployed Cloud Functions.
- Functions `npm run check` - passed (`node --check index.js`).
- Module-load check - passed; both callable exports loaded and Admin Firestore exposed `recursiveDelete`.
- `npx tsc --noEmit --incremental false` - passed.
- `npm run lint` - passed with zero errors or warnings.
- `npm run build` - passed with Next.js 16.2.10, `.env.local`, and all existing public/admin routes.
- No live grower was created or deleted during verification.
- The Functions dependency audit reports nine transitive moderate `uuid` advisories in the currently compatible Firebase Admin 13 / Functions 7 dependency tree. npm offers only a breaking forced downgrade, so no unsafe forced audit fix was applied.

### Deployment Status and Manual Tests

- The function source is ready, but the two callables are **not deployed yet**. Deploying a permanent account-deletion backend is a live, potentially billable Firebase change and requires explicit user approval.
- Until deployment, the new buttons cannot complete their callable operations against the live project.
- After deployment, test with an agreed disposable grower only:
  1. Sign in as an active admin and create one test grower; confirm the admin remains signed in.
  2. Confirm the Auth user and selected `user/{uid}` profile exist with all compatibility fields and one numeric `user_id`.
  3. Confirm the reset email arrives; also verify the warning path if email delivery is blocked.
  4. Confirm blank/invalid fields, duplicate email, signed-out access, inactive/non-admin access, self-delete, and admin-target delete are rejected.
  5. Add disposable nested system/history records, type `DELETE`, and confirm Auth/profile/nested data are removed while issue reports and global alerts remain.
  6. Confirm Cancel/Escape never writes, and a wrong confirmation value cannot enable deletion.
