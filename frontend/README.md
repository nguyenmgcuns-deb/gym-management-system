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

## Where data is stored

| Data | Stored in | Shared across devices |
|---|---|---|
| Account, workouts, exercises, gym visits, water, weight, profile | Backend (PostgreSQL) | ✅ |
| Login token | `localStorage` (`gymtracker.token`) | — |
| Weekly gym target | `localStorage`, per user | ❌ (bug #7 in `docs/BUGS.md`) |

## Testing against the real backend

1. Start the backend (`uvicorn app.main:app` in `backend/`) and the frontend (`npm run dev`).
2. Register a test account at `/register`, then log in.
3. Go through the checklist below, then **refresh the page** and **log in from a private window**.
   Everything stored in the backend must still be there.

| Check | Expected |
|---|---|
| Register with an existing email | "Email already registered" |
| Log in with a wrong password | "Incorrect email or password" |
| Open `/workouts` while logged out | Sent to login, then back to `/workouts` |
| Create a workout with 3 exercises (one without weight) | Detail page shows 3 rows, "Bodyweight" for the empty one |
| Complete it | Badge turns "Completed", it appears in Workout history |
| Check in, then check out | Visit appears with a duration |
| Add water / record weight | Dashboard cards update |
| Change first or last name in My profile | Top bar updates, value kept after refresh |
| Stop the backend and refresh | "Can't reach the server" with *Try again*, still logged in |
| Phone width (≈390px) | Menu button opens the sidebar; no sideways scrolling |

Last full run (Nov 8, 2026): all checks passed on the production build (`npm run build && npm run preview`)
with a fresh browser session confirming the backend data survived.

## Pages

| Route | Page | Backend calls |
|---|---|---|
| `/register` | Create account (client validation + API errors) | `POST /api/auth/register` |
| `/login` | Log in, token saved to `localStorage` | `POST /api/auth/login`, `GET /api/users/me` |
| `/` | Dashboard: today's workout, water, weight, weekly sessions, weekly activity, recent workouts | `GET /api/workouts`, `/api/workouts/history`, `/api/workouts/{id}/exercises`, `/api/gym/history` |
| `/gym` | Check in / out with live timer, weekly target, visit history | `POST /api/gym/check-in`, `POST /api/gym/check-out`, `GET /api/gym/history` |
| `/workouts` | Workout list with filters, complete, view, edit, delete | `GET /api/workouts`, `POST …/complete`, `DELETE /api/workouts/{id}` |
| `/workouts/new`, `/workouts/:id/edit` | Create / edit a workout, add exercises with sets, reps, weight | `POST`/`PUT /api/workouts`, `POST /api/workouts/{id}/exercises`, `GET /api/exercises` |
| `/workouts/:id` | Workout detail: exercises, totals, volume | `GET /api/workouts/{id}`, `GET …/exercises` |
| `/history` | Completed workouts with expandable exercises | `GET /api/workouts/history?limit=100` |
| `/exercises` | Browse the 252-exercise catalog | `GET /api/exercises` |
| `/water` | Daily goal, progress, quick-add, today's log, last 7 days | `GET`/`POST /api/water`, `DELETE /api/water/{id}`, `GET`/`PUT /api/water/goal` |
| `/weight` | Record weight, trend chart, history | `GET`/`POST /api/weight`, `DELETE /api/weight/{id}` |
| `/stats` | Simple totals and averages | reads workouts, gym, water, weight |
| `/profile` | Edit first / last name | `PUT /api/users/me` |

All calls live in `src/api/` (`auth.js`, `workouts.js`, `exercises.js`, `gym.js`, `water.js`, `weight.js`) and go through
`src/api/client.js`, which adds the token, turns FastAPI errors into readable messages, and logs the
user out on `401`. Pages use `useAsync` (`src/hooks/useAsync.js`) for loading / error / retry.

## Backend endpoints still needed

See "Still open" in [`../docs/API.md`](../docs/API.md) and the owners in [`../docs/BUGS.md`](../docs/BUGS.md).

## End-to-end test

```bash
npm run e2e     # backend + npm run dev must be running
```
