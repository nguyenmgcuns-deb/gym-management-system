# Gym Tracker — Backend

FastAPI + PostgreSQL API with email/password sign-up, JWT login, and a user profile.

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

> `create_all` only creates **new** tables — it never adds columns to an existing table.
> If you pull a model change and see "column does not exist", drop that table (or reset the
> dev database) and restart.

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

## Code map

| File | What's in it |
|---|---|
| `app/models/user.py` | `User` table (`id, email, password_hash, first_name, last_name, created_at`) |
| `app/models/exercise.py`, `workout.py`, `workout_exercise.py` | Workout data tables |
| `app/schemas/user.py` | Request/response shapes — responses never include `password_hash` |
| `app/routers/auth.py` | Register and login |
| `app/routers/users.py` | `GET` / `PUT /api/users/me` |
| `app/utils/security.py` | bcrypt hashing + JWT creation |
| `app/utils/dependencies.py` | `get_current_user` dependency |
| `app/seed.py` | Default exercises |

## Testing

### Swagger (http://127.0.0.1:8000/docs)

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
