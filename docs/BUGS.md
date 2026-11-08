# Bug list

Small, living list. Every item has an owner. Update the status in the same PR that fixes it.

**Owners** (change the names to match the team):
- **P1**: backend auth and users
- **P2**: backend workouts, gym, water and weight
- **P3**: frontend pages
- **P4**: dashboard integration and testing

Severity: **High** = wrong data or security · **Med** = broken feature or confusing UX · **Low** = polish

## Open

| # | Problem | How to reproduce | Severity | Owner |
|---|---|---|---|---|
| 1 | Two people registering the same email at the same moment: one gets **500** instead of 400 | Send 6 parallel `POST /api/auth/register` with one email (reproduced: `[201, 500]`) | Med | P1 |
| 2 | Emails are case-sensitive: `Bob@x.com` and `bob@x.com` become **two accounts** | Register both (reproduced: `201, 201`) | Med | P1 |
| 3 | Backend accepts a **1-character password**. Only the frontend asks for 8+ | `POST /api/auth/register` with `"password": "x"` → 201 (reproduced) | Med | P1 |
| 4 | No database migrations: `create_all` never adds new columns, so model changes break older databases (`column "sets" does not exist` happened once) | Run an old DB against a newer model | Med | P1 + P2 |
| 5 | Saved exercises in a workout **can't be edited or removed** | Add a wrong exercise, save, then try to remove it | Med | P2 (`PUT`/`DELETE /api/workouts/{id}/exercises/{item_id}`) → P3 (buttons) |
| 6 | Dashboard makes **one extra request per recent workout** to count exercises | Open the dashboard, watch the network tab: 5 `…/exercises` calls | Low | P2 (add `exercise_count`) → P3 |
| 7 | Weekly gym target is saved **per browser** | Change it, then log in elsewhere: it's back to 5 | Low | P2 (field on user) → P3 |
| 8 | Workout history stops at **100** | Complete 101 workouts | Low | P2 (`offset` param) → P3 |
| 9 | CORS allows every origin (`*`) | `backend/app/main.py` | Low (dev) / High (prod) | P1, before deploying |
| 10 | No refresh token: after 60 min the user is sent to login mid-session | Wait for the token to expire | Low | P1 (decide), P3 |
| 11 | `POST /api/weight` without a date uses the **server's** date | Only matters if a client omits `date`. The web app always sends the local date | Low | P2 |

## Fixed

| # | Problem | Fixed in | Owner |
|---|---|---|---|
| F1 | Refreshing while the backend was down **logged the user out** | `FrontEnd` (retry screen, token kept) | P3 |
| F2 | Water and weight were only stored in the browser | this branch: new `/api/water`, `/api/weight` + frontend | P2 + P4 |
| F3 | `workout_exercises` table on dev DBs was missing `sets/reps/weight` | Columns added locally. Steps in `backend/README.md` | P2 |
| F4 | Dashboard's 5th card wrapped to a new row; "Previous  week" had a double space | this branch | P4 |
| F5 | 500 errors showed "Request failed (500)" | this branch: readable messages | P4 |
| F6 | Completing or deleting from the workout list gave no feedback | this branch: success messages | P4 |
| F7 | Duplicate `import` in `main.py`, seed list had 4 exercises | `BackEnd` | P1 |

## Checked and not a bug

- User B can't read, change or delete User A's workouts, gym sessions, water, weight or profile (`backend/tests/security_test.py`, 35/35).
- Forged, unsigned (`alg=none`), expired and garbage tokens are rejected with 401.
- `password_hash` is never returned by any endpoint.
