FILES_TODO.md — per-file next steps (read ROADMAP.md before working)

Guidance: Each file below has one or two concrete next tasks. After completing a task, update both the file's TODO block and this list.

functions/
- index.js: move orchestration trigger to Cloud Tasks/PubSub; add request schema validation and auth.
- orchestrator/pipeline.js: split pipeline into idempotent tasks that can be enqueued; add structured logging.
- platform/msal_helper.js: created. Next: run `npm install @azure/msal-node` in `functions` and enable token acquisition.
- platform/sharepoint_adapter.js: switch to Graph where appropriate; add retries and caching.
- platform/excel_adapter.js: validate workbook/table names and batch writes.
- platform/graph_calendar.js: improve timezone handling and support resource calendars.
- platform/graph_email.js: replace temporary send with MSAL-backed send and add send queue.
- approval/router.js: persist approvals and add callback/webhook handling for approvals.
- procurement/requester.js: create procurement list items and attach metadata.
- notify/email.js: centralize templates and add retry queue.
- datastore/excel_backend.js: batch writes to Excel and add retry/backoff.
- datastore/audit.js: add TTL/retention policy and index strategy.
- inventory/checker.js: add fuzzy matching, caching, and bulk queries.

frontend/
- src/components/IntakeForm.jsx: add client-side validation and analytics; add E2E tests.
- src/components/Dashboard.jsx: replace mocks with API calls; add approve/reject actions.
- src/components/MobileDashboard.jsx: ensure parity with desktop and add touch tests.
- src/App.jsx: add route-based code splitting and ARIA labels.
- src/main.jsx: add error boundary and analytics initialization.

repo-wide
- Create platform/msal_helper.js and add `@azure/msal-node` dependency in `functions/package.json`.
- Add GitHub Actions CI: lint, test, build, and deploy hosting on push to main.
- Add integration tests using Firebase emulator for functions + Firestore.

Start every edit by opening `ROADMAP.md` and picking the top-priority task; update both the file and `FILES_TODO.md` when done.
