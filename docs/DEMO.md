# Demo script (about 4 minutes)

## Before the demo (5 min, once)

1. Start PostgreSQL, the backend (`uvicorn app.main:app`) and the frontend (`npm run dev`).
2. `cd backend && python scripts/seed_demo.py` creates `demo@gymtracker.dev` / `Demo1234!` with 3 weeks of data.
3. Open http://localhost:5173 in a normal window **and** a private window. Log the private window out.
4. Optional: open http://127.0.0.1:8000/docs in a third tab.

## The flow

| Time | Who talks | Show | Say |
|---|---|---|---|
| 0:00 | P3 | Login page → log in as the demo user | "GymTracker helps you plan workouts, log them, and track gym visits, water and weight." |
| 0:20 | P4 | **Dashboard** | Five cards: today's workout, water, current weight, sessions this week vs target, workouts this month. Recent workouts table with exercise counts. |
| 0:50 | P3 | **Workout plans → New workout** | Search the 252-exercise catalog ("bench"), filter by muscle group, add 2 exercises with sets/reps/kg, one bodyweight. Create. |
| 1:30 | P2 | Workout detail → **Complete workout** | Totals and volume (sets × reps × kg). Status turns *Completed*; it appears in **Workout history** (expand a row). |
| 2:00 | P2 | **Gym sessions** → Check in → Check out | Live timer while checked in. Duration is computed by the backend at check-out. |
| 2:25 | P4 | **Water** → +500 ml, **Weight** → 76.2 kg | Goal progress bar, 7-day history, weight trend chart. All saved on the server. |
| 2:50 | P4 | **Statistics** | Simple numbers from existing data: completed vs last month, average workout length, gym time, water goal days, weight change. |
| 3:10 | P1 | Private window: log in as the demo user | Same data on a "different device", because everything lives in PostgreSQL. |
| 3:30 | P1 | Register a second user, open the demo's workout URL | **404 "This workout does not exist."** Users can't see each other's data (35-check security test). |
| 3:50 | P3 | Resize to phone width | Sidebar becomes a drawer; tables become cards. |
| 4:10 | all | — | Questions. Mention tests: `smoke_test.py`, `security_test.py`, `npm run e2e`. |

**If something breaks during the demo:** the app shows a readable error with *Try again*. Say so, restart the
backend, and press it. That shows the error handling.

## Who implemented what

Rename P1–P4 to team members' names. The table follows the task split.

| Person | Area | Implemented |
|---|---|---|
| **P1** | Backend: auth and users | `User` model, register/login, password hashing (bcrypt), JWT + `get_current_user`, `GET`/`PUT /api/users/me`, CORS, auth README |
| **P2** | Backend: training data | `Exercise` (252 seeded), `Workout`, `WorkoutExercise`, `GymSession` models; workout CRUD, add exercises, complete, history; gym check-in/out/history; ownership checks; smoke test |
| **P3** | Frontend pages | React/Vite setup, theme, API client, register/login, protected routes, app shell, workout list/form/detail/history, exercise catalog, gym page, profile, responsive layout |
| **P4** | Dashboard and integration | Dashboard cards (incl. monthly count), water and weight endpoints and pages, statistics page, UI states, API contract (`docs/API.md`), end-to-end test, security test, bug list, README, this demo |

## Numbers worth mentioning

- 25 API endpoints, all used by the frontend and checked against the backend's OpenAPI spec
- 252 exercises across 8 muscle groups
- Tests: API smoke test (all endpoints), security test (35 checks), end-to-end journey (17 steps)
- Works at laptop (1366px) and phone (390px) widths with no sideways scrolling
