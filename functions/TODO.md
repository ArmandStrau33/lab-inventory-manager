# Functions — Per-file TODOs (single source)

This file summarizes the concrete NEXT ACTION items for each file under `functions/` so the ROADMAP and local edits remain synchronized.

- `index.js` — Replace setImmediate orchestration with Cloud Tasks enqueue; add request schema validation (Joi/zod); add App Check or API auth; add correlation id logging.
- `orchestrator/pipeline.js` — Break pipeline into idempotent tasks; implement Cloud Tasks consumer for each step; add unit tests for error paths and idempotency token handling.
- `platform/msal_helper.js` — Add unit tests; add retry/backoff; support certificate auth and Key Vault secret fetch.
- `platform/sharepoint_adapter.js` — Add exponential backoff with jitter, sanitize OData filters, and add integration tests against dev SharePoint.
- `platform/excel_adapter.js` — Validate drive/file/table on init; implement batching queue and retry/backoff; add tests for 429 handling.
- `platform/graph_calendar.js` — Add free/busy cache (LRU TTL), extract timezone helper, and unit tests for booking conflicts.
- `platform/graph_email.js` — Move templates to `functions/templates/`, add retry queue, and log message ids/delivery status.
- `inventory/checker.js` — Add fuzzy matching and in-memory TTL cache; surface partial failures and add tests.
- `procurement/requester.js` — Persist procurements to Firestore and emit audit events; call procurement email; add retries.
- `approval/router.js` — Persist approvals in Firestore, implement `/webhook/approval-callback`, and resume orchestration upon callback.
	- Status: basic persistence and webhook implemented (approvals_pending + approvals collections).
	- NEXT: add Cloud Task producer on callback to resume the pipeline and add unit tests for webhook security and idempotency.
- `calendar/scheduler.js` — Normalize timezones, add unit tests mocking Graph/SharePoint adapters, and handle capacity constraints.
- `datastore/excel_backend.js` — Implement batch writer for Excel, persist pending rows to Firestore, and add retry/backoff.
- `datastore/audit.js` — Add Firestore index on `timestamp`, implement TTL/archival job, and provide CLI export for old logs.
- `notify/email.js` — Move templates to `functions/templates` and support Teams adaptive cards; implement delivery status logging.
- `common/models.js` — Implement `fromFirestore`/`toFirestore`, `normalizeMaterials`, and add model unit tests.
- `config/settings.js` — Add mapping to `firebase functions:config` keys and document exact env names in README.
	- Status: added clearer env mappings, defaults, and NEXT ACTIONs in the file.
	- NEXT: implement a startup config validator and consider Secret Manager for secrets.

Recent small edits (delta):
- `common/models.js`: added `fromFirestore`, `toFirestore`, and `normalizeMaterials` helpers. NEXT: add unit tests and use these helpers across codebase.
- `notify/email.js`: added a tiny template renderer and replaced inline HTML with simple templates; moved NEXT ACTION to move templates to `functions/templates/` and add delivery logging.
- `config/settings.js`: expanded comments and env parsing; NEXT: add startup validator and document exact `firebase functions:config` commands in `MICROSOFT_AUTOMATION_SETUP.md`.

# Functions NEXT ACTIONS (auto-generated)

## Recent edits (2025-08-31)
- Inline NEXT ACTIONs added to 17 backend files to clarify immediate engineering tasks.

## Prioritized next steps
1. Choose deploy path: Quick unblock (Node 18) or Gen‑2 migration (Node 20).
2. Add auth for endpoints and secure webhook callbacks.
3. Replace setImmediate orchestration with Cloud Tasks or Pub/Sub.
4. Implement durable queues for outbound Graph/SharePoint writes and Excel batching.
5. Add unit tests and a CI pipeline to run build/lint/tests on PRs.

Deployment/runtime decision:
- There is an active blocker when deploying functions related to Gen-1 vs Gen-2 Node runtimes. See `MICROSOFT_AUTOMATION_SETUP.md` for recommended quick-unblock (keep Node 18) or full Gen-2 migration (Node 20). NEXT: confirm preferred path and apply consistent changes to `functions/package.json` and `package-lock.json`.
- `package.json` — Do not edit comments here; use `functions/TODO.md` and `ROADMAP.md` for package/runtime decisions; keep a note in ROADMAP about Node runtime choice.

Usage:
- Read `ROADMAP.md` first for iteration priorities.
- Then read `functions/TODO.md` for per-file next actions and pick the top-priority item to implement.

Small rule: every code edit must add/advance the corresponding TODO entry with the new next-step.
