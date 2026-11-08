# GymTracker — Frontend

React + Vite single-page app for the GymTracker API.

## Run it

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

## Folder structure

```
src/
  api/          one place for every backend call (fetch wrapper + one file per resource)
  components/   app-specific pieces (sidebar, top bar, route guard, forms)
  context/      React context (logged-in user + token)
  hooks/        reusable hooks (loading / error state for API calls)
  layouts/      page frames (app shell with sidebar)
  pages/        one file per screen
  ui/           shared, generic UI (Card, Field, Alert, Spinner, Icon …)
  utils/        small helpers (dates, local storage)
  styles/       global.css — design tokens and all styles
```
