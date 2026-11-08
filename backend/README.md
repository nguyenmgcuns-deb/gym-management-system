# Gym Tracker — Backend

FastAPI + PostgreSQL API with email/password sign-up, JWT login, a user profile,
workouts with exercises, and gym check-in/check-out.

## Run it locally

Requirements: Python 3.12, PostgreSQL running locally.

```bash
cd backend

# 1. Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create the database (once)
#    In psql or pgAdmin:  CREATE DATABASE gymtracker;

# 4. Create your .env (see below)
copy .env.example .env         # Windows
# cp .env.example .env         # macOS / Linux

# 5. Start the server
uvicorn app.main:app --reload
```

- API: http://127.0.0.1:8000
- Swagger docs: http://127.0.0.1:8000/docs

On startup the app creates any missing tables and seeds a few default exercises.

> `create_all` only creates **new** tables. It never adds columns to an existing table.
> If you pull a model change and see "column does not exist", drop that table (or reset the
> dev database) and restart. Example: if you ran the app before `sets/reps/weight` were added,
> `workout_exercises` is missing them. If it's empty, run
> `DROP TABLE workout_exercises;` and restart.

## Environment variables (`backend/.env`)

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `DATABASE_URL` | yes | `postgresql+psycopg2://postgres:YOUR_PASSWORD@localhost:5432/gymtracker` | PostgreSQL connection |
| `SECRET_KEY` | yes | long random string | Signs JWT tokens |
| `ALGORITHM` | no (default `HS256`) | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | no (default `60`) | `60` | Token lifetime |

Generate a secret key:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Never commit `.env` — it is already in `.gitignore`. Only `.env.example` is committed.

## Authentication endpoints

| Method | Path | Auth | Body | Success |
|---|---|---|---|---|
| POST | `/api/auth/register` | — | `{email, password, first_name, last_name}` | `201` user (no password) |
| POST | `/api/auth/login` | — | `{email, password}` | `200` `{access_token, token_type: "bearer"}` |
| GET | `/api/users/me` | Bearer | — | `200` current user |
| PUT | `/api/users/me` | Bearer | `{first_name?, last_name?}` | `200` updated user |

Error responses:

| Case | Status | `detail` |
|---|---|---|
| Email already registered | 400 | `Email already registered` |
| Invalid / missing body fields | 422 | validation details |
| Wrong email or password | 401 | `Incorrect email or password` |
| No `Authorization` header | 401 | `Not authenticated` |
| Bad, tampered, or expired token | 401 | `Could not validate credentials` |

Send the token on protected routes as:

```
Authorization: Bearer <access_token>
```

## Using auth in your own routes

```python
from fastapi import Depends
from app.models.user import User
from app.utils.dependencies import get_current_user

@router.get("/something")
def my_route(current_user: User = Depends(get_current_user)):
    ...  # current_user is the logged-in User, or the request already got a 401
```

## Workout, exercise and gym endpoints

Every endpoint below needs `Authorization: Bearer <token>`. Users only ever see and change
their **own** data. Asking for another user's workout returns `404 Workout not found`,
the same as a workout that doesn't exist, so IDs can't be probed.

| Method | Path | Body | Success | Errors |
|---|---|---|---|---|
| GET | `/api/exercises` | — | `200` exercise catalog | |
| GET | `/api/workouts` | — | `200` all my workouts, newest first | |
| POST | `/api/workouts` | `{name, date?, duration?}` | `201` workout | `422` |
| GET | `/api/workouts/history?limit=20` | — | `200` my completed workouts, newest first (limit 1–100) | `422` |
| GET | `/api/workouts/{id}` | — | `200` workout | `404` |
| PUT | `/api/workouts/{id}` | `{name?, date?, duration?}` | `200` workout | `404`, `422` |
| DELETE | `/api/workouts/{id}` | — | `204` (its exercises are deleted too) | `404` |
| POST | `/api/workouts/{id}/exercises` | `{exercise_id, sets, reps, weight?}` | `201` workout exercise | `404` workout / exercise, `422` |
| GET | `/api/workouts/{id}/exercises` | — | `200` exercises in the workout | `404` |
| POST | `/api/workouts/{id}/complete` | — | `200` workout with `status: "completed"` | `400` already completed, `404` |
| POST | `/api/gym/check-in` | — | `201` gym session | `400` already checked in |
| POST | `/api/gym/check-out` | — | `200` session with `check_out` and `duration` (minutes) | `400` not checked in |
| GET | `/api/gym/history` | — | `200` my gym sessions, newest first | |

Field rules: `name` 1–100 chars, `duration` ≥ 0 (minutes), `sets` and `reps` > 0,
`weight` ≥ 0 or omitted (for bodyweight moves), `date` as `YYYY-MM-DD` (defaults to today).
A workout's `status` is `planned` until it's completed.

### Examples

Create a workout: `POST /api/workouts`

```json
{"name": "Leg day", "date": "2026-11-08", "duration": 60}
```
```json
{"id": 8, "name": "Leg day", "date": "2026-11-08", "duration": 60, "status": "planned"}
```

Add an exercise: `POST /api/workouts/8/exercises`

```json
{"exercise_id": 2, "sets": 3, "reps": 10, "weight": 60}
```
```json
{"id": 1, "workout_id": 8, "exercise_id": 2, "sets": 3, "reps": 10, "weight": 60.0}
```

Complete it: `POST /api/workouts/8/complete`

```json
{"id": 8, "name": "Leg day", "date": "2026-11-08", "duration": 60, "status": "completed"}
```

Gym check-out: `POST /api/gym/check-out`

```json
{"id": 1, "check_in": "2026-11-08T18:00:00+01:00", "check_out": "2026-11-08T19:15:00+01:00", "duration": 75}
```

Errors always look like `{"detail": "Workout not found"}`. Validation errors (`422`) return
a list in `detail` that shows which field failed.

## Seed data

On startup `app/seed.py` adds these exercises if they're missing. It's safe to run many times.
Get their IDs from `GET /api/exercises`.

| Muscle group | Exercises |
|---|---|
| Chest | Bench press, Incline dumbbell press, Push-up |
| Back | Deadlift, Pull-up, Barbell row |
| Legs | Squat, Lunge, Leg press, Romanian deadlift |
| Shoulders | Shoulder press, Lateral raise |
| Arms | Bicep curl, Tricep dip |
| Core | Plank, Crunch |

## Data models

| Table | Columns |
|---|---|
| `users` | `id, email (unique), password_hash, first_name, last_name, created_at` |
| `exercises` | `id, name (unique), muscle_group` |
| `workouts` | `id, user_id → users, name, date, duration, status` |
| `workout_exercises` | `id, workout_id → workouts (cascade delete), exercise_id → exercises, sets, reps, weight` |
| `gym_sessions` | `id, user_id → users, check_in, check_out, duration` |

## Code map

| File | What's in it |
|---|---|
| `app/models/` | SQLAlchemy tables (see above) |
| `app/schemas/user.py` | User request/response shapes. Responses never include `password_hash`. |
| `app/schemas/workout.py` | Workout and workout-exercise shapes and field rules |
| `app/schemas/exercise.py`, `gym_session.py` | Exercise and gym session responses |
| `app/routers/auth.py` | Register and login |
| `app/routers/users.py` | `GET` / `PUT /api/users/me` |
| `app/routers/workouts.py` | Workout CRUD, exercises in a workout, complete, history |
| `app/routers/exercises.py` | Exercise catalog |
| `app/routers/gym.py` | Check-in, check-out, gym history |
| `app/utils/security.py` | bcrypt hashing + JWT creation |
| `app/utils/dependencies.py` | `get_current_user` dependency |
| `app/seed.py` | Default exercises |
| `tests/smoke_test.py` | End-to-end checks for every endpoint, including ownership |

## Testing

### Automated check (fastest)

With the server running:

```bash
python tests/smoke_test.py            # all sections
python tests/smoke_test.py gym        # one section: crud, exercises, complete, history, gym, ownership
```

It registers two throwaway users (Alice and Bob), tests success and error cases for every
workout, exercise and gym endpoint, and checks that Bob can't read, edit, delete, or complete
Alice's data. It ends with `RESULT: ALL PASSED`.

### Swagger: workouts and gym

After you **Authorize** (steps below):

1. `GET /api/exercises`: note an `id`.
2. `POST /api/workouts` with `{"name": "Leg day"}`: note the workout `id`.
3. `POST /api/workouts/{id}/exercises` with `{"exercise_id": <id>, "sets": 3, "reps": 10, "weight": 60}`, which returns `201`.
4. `POST /api/workouts/{id}/complete` returns `200`. Call it again and it returns `400`.
5. `GET /api/workouts/history`: the workout is listed.
6. `POST /api/gym/check-in` returns `201`. Calling it again returns `400`. Then `POST /api/gym/check-out` returns `200` with `duration`.
7. Ownership: register a second user, authorize as them, call `GET /api/workouts/{id}` with the first user's workout ID, and you get `404`.

### Swagger: auth (http://127.0.0.1:8000/docs)

1. **Register** — open `POST /api/auth/register` → *Try it out* → send a new email → expect `201`.
2. Send the same email again → expect `400 Email already registered`.
3. **Login** — `POST /api/auth/login` with the right password → copy `access_token`.
4. Try a wrong password → expect `401`.
5. Click **Authorize** (padlock, top right), paste the token (without the word `Bearer`) → *Authorize*.
6. `GET /api/users/me` → expect `200` with your user.
7. `PUT /api/users/me` with `{"first_name": "New"}` → expect `200`.
8. Click **Authorize** → *Logout*, call `GET /api/users/me` again → expect `401 Not authenticated` (missing token).

### Postman

1. `POST http://127.0.0.1:8000/api/auth/register`, Body → raw → JSON:
   ```json
   {"email": "me@example.com", "password": "secret123", "first_name": "Me", "last_name": "Test"}
   ```
2. `POST http://127.0.0.1:8000/api/auth/login` with `{"email": "...", "password": "..."}` → copy `access_token`.
3. `GET http://127.0.0.1:8000/api/users/me`, Authorization tab → Type **Bearer Token** → paste token.
4. Failure checks:
   - No Authorization → `401 Not authenticated`
   - Token `abc.def.ghi` → `401 Could not validate credentials`
   - Wrong password at login → `401 Incorrect email or password`
   - Duplicate register → `400 Email already registered`

### curl (quick check)

```bash
curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"me@example.com","password":"secret123"}'

curl http://127.0.0.1:8000/api/users/me -H "Authorization: Bearer <token>"
```
