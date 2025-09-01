import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// TODOs:
// - Add global error boundary
// - Add analytics and Sentry (or similar) initialization here
// - Add i18n bootstrap if multi-language required
// NEXT ACTION (ROADMAP):
// 1) Add a minimal ErrorBoundary component and wrap <App /> here.
// 2) Initialize minimal analytics (GA or Plausible) if required and guarded by env.
