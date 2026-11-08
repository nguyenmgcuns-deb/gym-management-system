# GymTracker API contract

The single list of endpoints the frontend uses. **Backend owners (Persons 1–2) and the frontend owner (Person 3) should
confirm this file before merging.** If a name or shape changes, update this file in the same PR.

- Base URL: `VITE_API_URL` (frontend `.env`), default `http://127.0.0.1:8000`
- Interactive docs: `http://127.0.0.1:8000/docs`
- All request and response bodies are JSON. Dates are `YYYY-MM-DD`; date-times are ISO 8601 with time zone.

## Authentication

| Item | Value |
|---|---|
| Login | `POST /api/auth/login` → `{ "access_token": "...", "token_type": "bearer" }` |
| Sending the token | Header `Authorization: Bearer <access_token>` on every endpoint except register and login |
| Token type | JWT, HS256, `sub` = user id, expires after `ACCESS_TOKEN_EXPIRE_MINUTES` (default 60) |
| Frontend storage | `localStorage["gymtracker.token"]` |
| Expired or invalid token | Any `401` → the frontend clears the token and sends the user to `/login` |
| Ownership | Every endpoint only returns the logged-in user's data. Another user's item returns `404`, the same as a missing item |

## Endpoints (25, all used by the frontend)

Checked automatically: every call in `frontend/src/api/*.js` matches a route in the backend's OpenAPI spec.

### Auth & profile — `frontend/src/api/auth.js`
| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/api/auth/register` | `{email, password, first_name, last_name}` | `201` user |
| POST | `/api/auth/login` | `{email, password}` | `200` token |
| GET | `/api/users/me` | — | user `{id, email, first_name, last_name, created_at}` |
| PUT | `/api/users/me` | `{first_name?, last_name?}` | user |

### Workouts — `frontend/src/api/workouts.js`
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/workouts` | — | workouts, newest first |
| POST | `/api/workouts` | `{name, date?, duration?}` | `201` workout `{id, name, date, duration, status}` |
| GET | `/api/workouts/history?limit=` | — | completed workouts (limit 1–100) |
| GET | `/api/workouts/{id}` | — | workout |
| PUT | `/api/workouts/{id}` | `{name?, date?, duration?}` | workout |
| DELETE | `/api/workouts/{id}` | — | `204` |
| POST | `/api/workouts/{id}/complete` | — | workout (`400` if already completed) |
| GET | `/api/workouts/{id}/exercises` | — | `[{id, workout_id, exercise_id, sets, reps, weight}]` |
| POST | `/api/workouts/{id}/exercises` | `{exercise_id, sets, reps, weight?}` | `201` workout exercise |

### Exercises — `frontend/src/api/exercises.js`
| Method | Path | Returns |
|---|---|---|
| GET | `/api/exercises` | `[{id, name, muscle_group}]` (252 seeded) |

### Gym — `frontend/src/api/gym.js`
| Method | Path | Returns |
|---|---|---|
| POST | `/api/gym/check-in` | `201` session (`400` if already checked in) |
| POST | `/api/gym/check-out` | session with `check_out` and `duration` in minutes (`400` if not checked in) |
| GET | `/api/gym/history` | `[{id, check_in, check_out, duration}]`, newest first |

### Water — `frontend/src/api/water.js` *(added in this branch)*
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/water?since=<ISO datetime>` | — | `[{id, amount_ml, logged_at}]`, newest first (default: last 7 days) |
| POST | `/api/water` | `{amount_ml}` (1–5000) | `201` log, timestamped now |
| DELETE | `/api/water/{id}` | — | `204` |
| GET | `/api/water/goal` | — | `{daily_goal_ml}` (3000 until set) |
| PUT | `/api/water/goal` | `{daily_goal_ml}` (500–10000) | `{daily_goal_ml}` |

The backend stores time stamps. The frontend groups logs into the user's **local** days, so the backend doesn't need
time zone logic.

### Weight — `frontend/src/api/weight.js` *(added in this branch)*
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/weight?limit=` | — | `[{id, weight_kg, date}]`, newest first (limit 1–365) |
| POST | `/api/weight` | `{weight_kg, date?}` (20–400 kg) | `201` new, or `200` when it replaces that day's entry |
| DELETE | `/api/weight/{id}` | — | `204` |

## Errors

| Status | Body | Frontend shows |
|---|---|---|
| 400 / 404 | `{"detail": "Readable message"}` | the message |
| 401 | `{"detail": "..."}` | logs out → login page |
| 422 | `{"detail": [{loc, msg}, ...]}` | message under each form field; a single error names the field |
| 5xx / network | — | "Something went wrong on the server…" / "Can't reach the server…" with *Try again* |

## What the frontend does *not* do (no duplicated backend logic)

- It never decides ownership. It always asks the API, which filters by user.
- It never calculates a gym session's stored duration. That comes from `check-out`.
- It never marks workouts completed locally. It uses the `complete` endpoint's response.
- It only computes **display** numbers from API data: totals per day or week, averages and volume (`sets × reps × kg`).

## Still open (for the backend owners)

| Request | Why |
|---|---|
| `PUT` / `DELETE /api/workouts/{id}/exercises/{item_id}` | Saved exercises can't be edited or removed yet |
| Exercise count (or the exercises) inside `GET /api/workouts` / `/history` | The dashboard makes one extra request per recent workout |
| `weekly_session_target` on the user | Saved per browser for now |
| `offset` on `/api/workouts/history` | History stops at 100 |
