Lab Inventory Management — Minimal Firebase Scaffold

This repository contains a minimal, runnable scaffold for the Lab Inventory Management app described in the spec. It includes:

- A React frontend (Vite) with a simple intake form and your provided Firebase config.
- A Firebase Functions backend (Node.js) that accepts intake submissions and writes them to Firestore.
- A basic project layout to extend the orchestrator, inventory, approval, calendar and notification modules.

What I created
- `frontend/` — React + Vite app. `src/components/IntakeForm.jsx` is the intake form.
- `functions/` — Firebase Functions backend. `index.js` exposes an HTTP endpoint `/submit`.
- `firebase.json` and `.firebaserc` — Firebase project configuration (uses your provided project id).

Quick start (Windows PowerShell)

1) Install Firebase CLI (if not installed):
```powershell
npm install -g firebase-tools
```

2) Install deps for frontend and functions:
```powershell
cd "C:\Users\arman\OneDrive\Desktop\Developement\Lab Inventory Managment\frontend"
npm install
cd ..\functions
npm install
```

3) Run frontend locally:
```powershell
cd frontend
npm run dev
```

4) Emulate functions locally (optional):
```powershell
firebase emulators:start --only functions,firestore,hosting
```

5) Deploy to Firebase (login required):
```powershell
firebase deploy --only hosting,functions
```

Notes
- This is a starting scaffold. Core orchestrator logic (inventory checks, procurement, approvals, calendar ops, and Graph API integrations) are provided as stubs in `functions/orchestrator/` to implement next.
- Firestore rules and production security are not included — add rules and secure service accounts before production.

Next steps I can take for you
- Implement the orchestrator pipeline in the Functions backend calling Microsoft Graph.
- Add authentication (Firebase Auth) for teachers and approvers.
- Add unit tests and CI pipeline for builds and linting.

If you want me to continue, tell me which piece to implement next (or I can implement the entire orchestrator and basic Graph adapters).

## Collaboration

This repository is configured to use GitHub for collaboration. To invite another developer, add them as a collaborator in the repository Settings → Manage access.

## CI / Deploy

A GitHub Actions workflow `/.github/workflows/ci-deploy.yml` builds the frontend and deploys to Firebase Hosting on push to `main`.

Required secret:
- `FIREBASE_TOKEN` — a CI token for the Firebase CLI. Create it with `firebase login:ci` and add it to the repository secrets.
