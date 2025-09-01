# Roadmap and Next Actions

This roadmap lists remaining work, per-file TODOs, deployment steps, and priorities. Each iteration should read this file first before making edits.

## High-level checklist

- [ ] Stabilize Firebase Functions deployment (fix runtime/SDK and re-deploy)
- [ ] Implement MSAL client-credentials token helper for Graph API and store tokens securely
- [ ] Wire SharePoint/Graph adapters to use MSAL tokens (replace ACCESS_TOKEN env)
- [ ] Implement Approval flow (Power Automate or Teams Adaptive Cards) and persist approvals
- [ ] Implement Procurement integration (SharePoint procurement list or external system)
- [ ] Add robust error handling, retries, and idempotency (Cloud Tasks / PubSub)
- [ ] Add unit tests and small CI (GitHub Actions) for critical modules
- [ ] Add Firestore security rules and deployment scripts

## Immediate priorities (this iteration)

1. Code completeness pass across functions and platform adapters. (IN PROGRESS)
2. Add TODO comments and markers in each file describing exact next steps. (DONE — most modules)
3. Create this ROADMAP.md and ensure `index.js` triggers orchestrator asynchronously. (DONE)

### This edit pass (delta)

- Hardened `functions/platform/msal_helper.js`: added `validateSettings()`, exposed `clearCache()`, and expanded NEXT ACTIONs for tests and certificate auth.
- Improved `functions/orchestrator/pipeline.js`: added safe `writeLastStep()` helper, added defensive error handling around notifications and scheduling, and more explicit persistence markers.
- Tuned `functions/config/settings.js`: added `DISABLE_GRAPH` flag and noted a startup validator NEXT ACTION.

Files to address next (concrete small PRs):
- `functions/platform/sharepoint_adapter.js` — wire `getAccessToken()` usage and add unit-tests with axios mock.
- `functions/platform/graph_email.js` — route through msal_helper and add delivery logging.
- `functions/datastore/excel_backend.js` — implement minimal retry wrapper for Excel writes and persist pending rows.
- `functions/index.js` — replace `setImmediate` with Cloud Tasks producer (PoC) or at minimum add an env-guarded Cloud Tasks toggle.

Follow the iteration loop: read this file first, pick one file above, implement a focused change, add TODOs, run local checks, then update this roadmap with the delta.

## Per-file notes & TODOs

- `functions/index.js`
  - Status: calls `processLabRequest` using `setImmediate`.
  - TODO: convert to enqueue Cloud Task or Pub/Sub message to support retries.
  - NEXT ACTION: add auth, schema validation, correlation logging

- `functions/orchestrator/pipeline.js`
  - Status: simple serial pipeline implemented.
  - TODO: add idempotency, error handling, and break pipeline into smaller steps/tasks.
  - NEXT ACTION: added idempotency guard notes, extract per-step handlers

- `functions/platform/sharepoint_adapter.js`
  - Status: REST adapter implemented using SharePoint REST API.
  - TODO: switch to Graph API for files and lists where possible; add OAuth token refresh.
  - TODO: add backoff and caching for inventory lookups.
  - NEXT ACTION: added retry wrapper and OData sanitization

- `functions/platform/excel_adapter.js`
  - Status: uses Graph workbook table APIs.
  - TODO: implement token refresh (MSAL) and validate table/worksheet names dynamically.
  - NEXT ACTION: batching and schema validation

- `functions/platform/graph_calendar.js`
  - Status: calendar operations implemented with Graph endpoints.
  - TODO: improve timezone handling; support group resource calendars and throttling.
  - NEXT ACTION: timezone normalization and conflict policies

- `functions/platform/graph_email.js`
  - Status: will send via Graph if ACCESS_TOKEN present; otherwise logs.
  - TODO: implement MSAL client-credentials flow and queue sends for reliability.
  - NEXT ACTION: delivery logging and retries

- `functions/approval/router.js`
  - Status: basic policy with email notifications to approvers; placeholder auto-approve.
  - TODO: integrate with Power Automate Approvals or Teams; persist decision.
  - NEXT ACTION: secure webhook and Cloud Tasks resume

- `functions/inventory/checker.js`
  - Status: uses SharePointAdapter; falls back to assume available on error.
  - TODO: add fuzzy matching, caching, and reliable missing-item detection.
  - NEXT ACTION: cache replacement and fuzzy matching

- `functions/procurement/requester.js`
  - Status: placeholder returns fake ticket id.
  - TODO: create procurement list item or integrate with procurement API; attach attachments.
  - NEXT ACTION: procurement email, queueing

- `functions/notify/email.js`
  - Status: uses graph_email; templates are inline.
  - TODO: move templates to a central folder and add localization.
  - NEXT ACTION: template move and transactional log

- `functions/datastore/excel_backend.js`
  - Status: writes to Firestore and to Excel if configured.
  - TODO: batch Excel writes and handle transient failures with retries.
  - NEXT ACTION: batching and persistent queue notes

- `functions/config/settings.js`
  - Status: env-based config file with TODO notes.
  - TODO: implement a secure token helper and document `firebase functions:config:set` commands in README.
  - NEXT ACTION: Secret Manager note and validation

## Deployment checklist

1. Ensure Firebase project `lab-manager1` is active and billing enabled for Functions.
2. Upgrade `firebase-functions` and `firebase-admin` if needed to match runtime (Node 20+ recommended).
3. Run `cd functions && npm install` and fix any dependency errors.
4. Set function configs for SharePoint and Azure app credentials:

```powershell
firebase functions:config:set \
  sharepoint.site_url="https://your-tenant.sharepoint.com/sites/your-site" \
  sharepoint.tenant_id="your-tenant-id" \
  sharepoint.client_id="your-client-id" \
  sharepoint.client_secret="your-client-secret" \
  excel.drive_id="your-drive-id" \
  excel.file_id="your-excel-file-id"
```

5. Deploy functions: `firebase deploy --only functions`

## Notes & Known Issues

- Functions deployment previously failed; likely causes: Node runtime mismatch, missing APIs, or permission issues.
- Microsoft Graph operations require proper app registration and delegated/application scopes.

---

Read this roadmap at the start of every iteration and update the checklist as you complete tasks.

## Iteration loop (strict)

1. Read this `ROADMAP.md` first. It contains the authoritative task list and priorities.
2. Select the highest-priority item from the High-level checklist or Immediate priorities.
3. Edit files to make a small, focused improvement. Add `// TODO` comments in files you touch describing the next concrete step.
4. Run quick local checks (lint/build/tests) where feasible.
5. Update `ROADMAP.md` with the delta: what you changed and what's next.
6. Commit and repeat.

This loop should be followed for every edit session.

## Outstanding implementation tasks (snapshot)

- Implement `functions/platform/msal_helper.js` (MSAL client-credentials token acquisition + caching)
- Wire adapters (`sharepoint_adapter`, `excel_adapter`, `graph_calendar`, `graph_email`) to use the MSAL helper
- Convert orchestration trigger to Cloud Tasks / PubSub for retries and observability
- Implement full Approval persistence and callback handling (Power Automate or Teams Approvals)
- Implement procurement persistence and vendor integration
- Add unit tests for pipeline, inventory checker, and scheduler
- Add CI workflow to run lint/build/tests and deploy hosting on push to main

Update this list as tasks are completed.

Per-file actionable TODOs are also centralized in `functions/TODO.md` — read it after `ROADMAP.md` to pick a file to work on.

## Recent edits (this iteration)

- Added `functions/platform/msal_helper.js` — a lightweight MSAL client-credentials helper with caching and a fallback to `ACCESS_TOKEN` when MSAL is not yet installed or configured.
- Wired adapters (`sharepoint_adapter`, `excel_adapter`, `graph_calendar`, `graph_email`) to accept token providers and to call the MSAL helper when available.
 - Implemented approval webhook and pending-approval persistence:
   - Added `/webhook/approval-callback` to `functions/index.js` which writes to `approvals` and updates `lab_requests` status.
   - `functions/approval/router.js` now persists pending approval records to `approvals_pending` and returns an awaiting state so the orchestrator pauses.
   - `functions/orchestrator/pipeline.js` now persists `AWAITING_APPROVAL` and returns early when approval is awaited; webhook resumes flow by updating `lab_requests` and adding history/audit events.

Next concrete approval-related steps:
- Wire Power Automate approval flow to POST to `/webhook/approval-callback` with { requestId, approved, approver, reason }.
- Implement a resume flow: Cloud Task producer on approval callback to re-enqueue or directly call `processLabRequest` for that request id.

Notes: the helper loads `@azure/msal-node` dynamically. You must install `@azure/msal-node` inside the `functions` folder before full MSAL functionality will work.

Note: `functions/package.json` was updated to include `@azure/msal-node` and `axios`; run `npm install` in the `functions` folder to materialize these dependencies before deploying.

Next concrete steps for MSAL and deployment:

- In the `functions` folder run:

```powershell
cd functions
npm install @azure/msal-node axios
```

- Ensure `functions/package.json` contains `@azure/msal-node` in dependencies, then set function configs:

```powershell
firebase functions:config:set \
  sharepoint.site_url="https://your-tenant.sharepoint.com/sites/your-site" \
  sharepoint.tenant_id="your-tenant-id" \
  sharepoint.client_id="your-client-id" \
  sharepoint.client_secret="your-client-secret" \
  excel.drive_id="your-drive-id" \
  excel.file_id="your-excel-file-id"
```

- After installing dependencies and setting configs, run `cd functions && npm run build` (if you have a build step) or `cd functions && npm install` then `firebase deploy --only functions`.

- If function creation fails, inspect the Firebase Console logs for runtime/SDK mismatch errors. Consider upgrading `firebase-functions`/`firebase-admin` and using Node 20 runtime in `package.json` engines.

## Delta — edits made on

- Added `fromFirestore`/`toFirestore`/`normalizeMaterials` helpers to `functions/common/models.js` and marked NEXT ACTION to add unit tests and replace ad-hoc parsing across the codebase.
- Replaced several inline email HTML fragments with a tiny template renderer in `functions/notify/email.js`; NEXT: move templates to `functions/templates/` and add delivery logging.
- Expanded comments and parsing in `functions/config/settings.js` and added NEXT ACTION items for secret management and startup validation.
- Updated `functions/TODO.md` with the recent edits and a note about the active Gen-1/Gen-2 deployment blocker.

- `functions/approval/router.js`: persist approvers list and correlation in `approvals_pending` (NEXT: secure webhook, resume task producer).
- `functions/calendar/scheduler.js`: include `correlation` in fallback bookings and normalize returned booking object.
- `functions/datastore/excel_backend.js`: defensive checks and NEXT action to add retry queue/persist pending rows.
- `functions/datastore/audit.js`: wrapped writes in try/catch and improved NEXT ACTION notes for indexing/TTL.

Runtime decision reminder: choose one of the following before the next deploy:
- Quick unblock: set `functions/package.json` engines.node to "18" and deploy (Gen-1).
- Migration: upgrade to Gen-2 (Node 20) and update `firebase-functions`/`firebase-admin` accordingly; this requires testing.

## Recent small improvements (automated edits in this iteration)

- `functions/platform/msal_helper.js`: added `getAccessToken()` convenience function and clarified NEXT ACTIONs for testing and certificate auth.
- `functions/platform/sharepoint_adapter.js`: added a small `axiosWithRetry` wrapper (exponential backoff), input sanitization for OData values, improved defensive parsing of responses, and expanded NEXT ACTIONs to migrate to Graph API.
- `functions/orchestrator/pipeline.js`: added an idempotency guard that checks `last_step` in Firestore to avoid double-processing and logs a SKIP row when appropriate.
- `functions/index.js`: added structured logging for correlation ids and expanded the per-file NEXT ACTION list for the endpoint.

Next immediate steps:

1. Decide runtime approach (quick unblock vs Gen‑2 migration).
2. Add unit tests for `msal_helper`, `sharepoint_adapter` (mock axios), and `orchestrator/pipeline`.
3. Create a Cloud Tasks proof-of-concept to replace `setImmediate` and allow retries.

Update the roadmap after each small PR as described in the iteration loop.

### 2025-08-31 — Patch delta: inline NEXT ACTIONs added
I performed a repo-wide pass through the `functions/` backend and added inline "NEXT ACTIONS / TODOs" comment blocks to many files so the roadmap accurately reflects per-file next steps. Files updated:

- `functions/index.js` — add auth, schema validation, correlation logging
- `functions/orchestrator/pipeline.js` — added idempotency guard notes, extract per-step handlers
- `functions/platform/msal_helper.js` — token caching, test and certificate auth notes
- `functions/platform/sharepoint_adapter.js` — added retry wrapper and OData sanitization
- `functions/approval/router.js` — secure webhook and Cloud Tasks resume
- `functions/inventory/checker.js` — cache replacement and fuzzy matching
- `functions/procurement/requester.js` — procurement email, queueing
- `functions/notify/email.js` — template move and transactional log
- `functions/datastore/excel_backend.js` — batching and persistent queue notes
- `functions/datastore/audit.js` — indexing and archival plan
- `functions/common/models.js` — serialization tests and JSDoc/types
- `functions/common/cache.js` — upgrade to LRU and metrics
- `functions/config/settings.js` — Secret Manager note and validation
- `functions/platform/graph_email.js` — delivery logging and retries
- `functions/platform/graph_calendar.js` — timezone normalization and conflict policies
- `functions/platform/excel_adapter.js` — batching and schema validation

Next priority engineering tasks (recommended order):
1. Unblock functions deploy (choose A or B):
   - A: Revert `functions/package.json` engines.node to "18", install msal & axios, deploy (fast).
   - B: Migrate to Gen‑2 (Node 20) and upgrade `firebase-functions`/`firebase-admin` (recommended long-term).
2. Replace `setImmediate` orchestration with Cloud Tasks / PubSub producer + worker.
3. Add authentication for webhook and API endpoints (validate JWT or shared secret).
4. Implement per-step idempotent handlers and add durable retry queues for outbound Graph calls.
5. Add unit tests for pipeline, adapters, and msal token logic; add CI job to run tests and lint.

If you want, I can proceed now with one of these priority tasks — tell me whether to attempt the Quick Unblock (A) or start the Gen‑2 migration (B).

---

### This micro-iteration (files updated in this pass)

- `functions/inventory/checker.js` — normalize inputs, improve cache usage, add TODOs
- `functions/procurement/requester.js` — defensive persistence and roadmap notes
- `functions/notify/email.js` — delivery logging notes and template roadmap
- `functions/datastore/audit.js` — indexing/TTL roadmap and export note
- `functions/common/models.js` — normalization and tests roadmap
- `functions/common/cache.js` — add metrics note and roadmap
- `functions/approval/router.js` — persist pending approval id and Cloud Tasks note
- `functions/calendar/scheduler.js` — better error handling and provisional booking flag
- `functions/platform/excel_adapter.js` — validation/batching roadmap

Next tiny steps (I can do these in the next pass):

1. Add `functions/templates/` and move at least one email template into it (small PR).
2. Implement a minimal transactional email log collection and persist one sample send result.
3. Create a Cloud Tasks PoC producer in `functions/index.js` gated by an env var.

Follow the iteration loop: I'll read this file at the start of the next pass.

---

## Generated per-file actionable checklist (source: functions/ folder)

This list is generated from the current `functions/` files and maps each file to a single, concrete next step to implement in a small PR. Follow this list strictly: pick a file, implement the single step, run the quick checks, then update this roadmap.

- `functions/package.json` — Ensure `engines.node` matches the chosen runtime (18 for quick-unblock; 20 for Gen-2 migration). Next: lock decision and annotate package.json with chosen runtime and compatibility notes.
- `functions/PACKAGE_NOTES.md` — Document any pinned package version and runtime reasoning. Next: add the exact `npm install` commands for chosen path (A or B).
- `functions/platform/sharepoint_adapter.js` — Next: add unit tests (mock axios) and add proper handling for 429/Retry-After headers.
- `functions/platform/msal_helper.js` — Next: add certificate-based auth option and unit tests for token caching and fallback behavior.
- `functions/platform/graph_email.js` — Next: implement a retry queue for transient Graph failures and persist Graph message metadata on success.
- `functions/platform/graph_calendar.js` — Next: add timezone normalization and respect `Retry-After` throttling headers; add unit tests for conflict resolution.
- `functions/platform/excel_adapter.js` — Next: validate `driveId`/`fileId`/table existence on construction and add a batching queue for `addTableRow`.
- `functions/procurement/requester.js` — Next: send procurement email via Graph including the persisted procurement id and Firestore link.
- `functions/index.js` — Next: add an env-gated Cloud Tasks PoC to enqueue orchestrations instead of `setImmediate`, and add simple auth middleware for `/submit` and webhooks.
- `functions/orchestrator/pipeline.js` — Next: extract per-step handlers into their own modules and make the orchestrator resumeable via Cloud Tasks (accept resume point).
- `functions/notify/email.js` — Next: move inline templates into `functions/templates/` and load them at startup; add transactional email logging on each send.
- `functions/inventory/checker.js` — Next: replace naive in-memory cache with `lru-cache` and add fuzzy matching/unit normalization for material lookups.
- `functions/datastore/excel_backend.js` — Next: implement a retry worker (scheduled or Cloud Task) that flushes `excel_pending_rows` and add batching flush logic.
- `functions/datastore/email_logs.js` — Next: add retention and query helpers; expose a small admin function to re-send failed emails.
- `functions/datastore/audit.js` — Next: implement scheduled export of old `audit_logs` to Cloud Storage/BigQuery and add Firestore composite indexes for queries.
- `functions/config/settings.js` — Next: document required `firebase functions:config:set` keys clearly and add a startup validator that fails fast when critical values are missing.
- `functions/calendar/scheduler.js` — Next: add timezone handling and idempotency markers for bookings; write unit tests for search-next-available logic.
- `functions/approval/router.js` — Next: secure webhook with a verification token or signed JWT and create Cloud Task producer to resume the orchestration when approval arrives.
- `functions/common/models.js` — Next: implement `toFirestore()` and unit tests for `fromFirestore()` / normalization helpers.
- `functions/common/cache.js` — Next: swap to `lru-cache`, add metrics counters and expose a small debug endpoint to inspect cache stats (for dev).
- `functions/TODO.md` — Next: sync this file with the per-file checklist above (mark items done as PRs land).

Use the single-concrete-step rule: for each file, only implement the one next-step listed above per iteration. After finishing, update this roadmap with the delta.
