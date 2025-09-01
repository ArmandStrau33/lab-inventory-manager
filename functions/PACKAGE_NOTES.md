# functions/package.json notes

Purpose: capture the current runtime decision, quick unblocks and migration notes separately from `package.json` (JSON can't contain comments).

Current decision: pending — choose one of the two options below before deploying functions.

Option A — Quick unblock (Node 18 / Gen‑1)
- Ensure `functions/package.json` contains:
  {
    "engines": { "node": "18" }
  }
- Install MSAL and axios in `functions/`:
  npm install @azure/msal-node axios --legacy-peer-deps
- Deploy functions quickly with `firebase deploy --only functions`.
- Pros: fastest to get Graph calls enabled.
- Cons: Gen‑1 is older; consider Gen‑2 later.

Option B — Migrate to Gen‑2 (Node 20)
- Update `functions/package.json` engines to node 20.
- Upgrade SDKs (example safe versions to try):
  - `firebase-admin@11.x` (check latest compatible)
  - `firebase-functions@4.x` (Gen‑2 compatible)
- Run `npm install` and test locally with emulator.
- Address any deprecations; add integration tests; then deploy.

Recommended temporary workflow:
- If you need features quickly, pick Option A now and schedule Option B as a listed roadmap item.

Troubleshooting
- If `firebase deploy` errors with "Cannot set CPU on the functions api because they are GCF gen 1", that means your project is Gen‑1 and you attempted Gen‑2 settings. Revert engines.node to "18".
- If npm reports peer dependency errors during MSAL install, re-run with `--legacy-peer-deps`.

CI/CD note
- Add a pipeline step that runs `npm ci` inside `functions/` and fails fast if dependencies are inconsistent.

Audit
- After deploying, capture the exact `functions/package.json` and `npm ls` output and commit `functions/` package-lock.json to repo for reproducible installs.
