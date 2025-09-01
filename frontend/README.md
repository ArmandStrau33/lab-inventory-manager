# Frontend — Lab Inventory Manager

This folder contains the React + Vite frontend.

Quick notes:
- The intake form posts to `/submit` (proxied to Firebase Functions in production).
- The Dashboard currently uses mocked data; replace with API calls to `/api/*` endpoints.
- See top-level `ROADMAP.md` for next actions and priorities.

TODOs:
- Wire the dashboard to real APIs and add tests
- Add E2E tests (Cypress) and unit tests (Jest + React Testing Library)
- Add CI to build and deploy the frontend automatically
