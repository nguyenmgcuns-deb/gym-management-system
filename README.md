# GymTracker

Full-stack gym tracking app: plan and log workouts, check in at the gym, and track water and body weight.

| Part | Stack | Folder |
|---|---|---|
| Frontend | React 19 + Vite | [`frontend/`](frontend/README.md) |
| Backend | FastAPI + SQLAlchemy | [`backend/`](backend/README.md) |
| Database | PostgreSQL | — |

## Quick start

You need **Python 3.12**, **Node.js 20+** and **PostgreSQL** running locally.

### 1. Database

```sql
-- in psql or pgAdmin
CREATE DATABASE gymtracker;
```

Tables are created automatically on the first backend start, and 252 exercises are seeded.

### 2. Backend (terminal 1)

```bash
cd backend
python -m venv venv
venv\Scripts\activate            # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env           # macOS/Linux: cp .env.example .env  (then edit it, see below)
uvicorn app.main:app --reload    # http://127.0.0.1:8000  ·  docs: http://127.0.0.1:8000/docs
```

### 3. Frontend (terminal 2)

```bash
cd frontend
npm install
copy .env.example .env           # macOS/Linux: cp .env.example .env
npm run dev                      # http://localhost:5173
```

### 4. Demo account (optional)

With the backend running:

```bash
cd backend
python scripts/seed_demo.py
```

| Email | Password |
|---|---|
| `demo@gymtracker.dev` | `Demo1234!` |

It has 3 weeks of workouts, a planned workout for today, a weight trend, water and a gym visit. Running the script
again doesn't add duplicates. You can also register your own account at `/register`.

## Environment variables

**`backend/.env`**

| Variable | Required | Example | What it does |
|---|---|---|---|
| `DATABASE_URL` | yes | `postgresql+psycopg2://postgres:PASSWORD@localhost:5432/gymtracker` | PostgreSQL connection |
| `SECRET_KEY` | yes | output of `python -c "import secrets; print(secrets.token_hex(32))"` | Signs login tokens. Keep it secret |
| `ALGORITHM` | no | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | no | `60` | How long a login lasts |

**`frontend/.env`**

| Variable | Required | Example | What it does |
|---|---|---|---|
| `VITE_API_URL` | no | `http://127.0.0.1:8000` | Backend address. Restart `npm run dev` after changing it |

Never commit `.env` files. Only the `.env.example` files are in git.

## API overview

All endpoints except register and login need `Authorization: Bearer <token>`. Users only ever see their own data.
The full contract with request and response shapes is in [`docs/API.md`](docs/API.md).

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Profile | `GET`/`PUT /api/users/me` |
| Workouts | `GET`/`POST /api/workouts`, `GET /api/workouts/history`, `GET`/`PUT`/`DELETE /api/workouts/{id}`, `POST /api/workouts/{id}/complete` |
| Workout exercises | `GET`/`POST /api/workouts/{id}/exercises` |
| Exercise catalog | `GET /api/exercises` |
| Gym | `POST /api/gym/check-in`, `POST /api/gym/check-out`, `GET /api/gym/history` |
| Water | `GET`/`POST /api/water`, `DELETE /api/water/{id}`, `GET`/`PUT /api/water/goal` |
| Weight | `GET`/`POST /api/weight`, `DELETE /api/weight/{id}` |

## Tests

Start the backend (and the frontend for the last one) first.

| Test | Command | Checks |
|---|---|---|
| API smoke test | `cd backend && python tests/smoke_test.py` | Every endpoint, success and error cases |
| Security test | `cd backend && python tests/security_test.py` | Users can't see or change each other's data; bad tokens rejected |
| End-to-end | `cd frontend && npm run e2e` | register → login → dashboard → workout → exercises → complete → check in/out → water → weight → history → logout/login |

The end-to-end test drives Microsoft Edge (Windows) or Chrome. Set `BROWSER_CHANNEL=chrome` to choose.

## Project docs

- [`docs/API.md`](docs/API.md): API contract between frontend and backend
- [`docs/BUGS.md`](docs/BUGS.md): open and fixed bugs with owners
- [`docs/DEMO.md`](docs/DEMO.md): 3–5 minute demo script and who built what
- [`backend/README.md`](backend/README.md) · [`frontend/README.md`](frontend/README.md): details per part

## Troubleshooting

| Problem | Fix |
|---|---|
| `DATABASE_URL is missing` | Create `backend/.env` from `.env.example` |
| `column ... does not exist` | Your database was created by an older version. In a dev DB, drop that table and restart the backend (see bug #4) |
| Frontend says "Can't reach the server" | Start the backend, or check `VITE_API_URL` in `frontend/.env` |
| Login works in Swagger but not in the app | Check that `VITE_API_URL` points to the same backend |
