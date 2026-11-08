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

## Backend URL

All requests go through `src/api/client.js`, which reads **`VITE_API_URL`**:

```bash
cp .env.example .env     # then edit VITE_API_URL if your backend isn't on http://127.0.0.1:8000
```

Restart `npm run dev` after changing `.env`. Never hard-code the URL in pages. Use the API helpers in `src/api/`.
