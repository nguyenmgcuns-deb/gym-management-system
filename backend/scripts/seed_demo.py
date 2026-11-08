"""Create (or refresh) the demo account with a few weeks of realistic data.

Start the server first (uvicorn app.main:app), then from backend/:
    python scripts/seed_demo.py
Uses the public API only, so it follows the same rules as the app.

Account: demo@gymtracker.dev / Demo1234!
Running it again adds nothing if the demo account already has workouts.
"""
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import date, timedelta

BASE = os.getenv("API_URL", "http://127.0.0.1:8000")
EMAIL, PASSWORD = "demo@gymtracker.dev", "Demo1234!"


def call(method, path, body=None, token=None):
    req = urllib.request.Request(BASE + path, method=method)
    if body is not None:
        req.add_header("Content-Type", "application/json")
        req.data = json.dumps(body).encode()
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read()
            return r.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        return e.code, None
    except urllib.error.URLError:
        sys.exit(f"Can't reach {BASE}. Start the backend first.")


def day(n):
    return (date.today() - timedelta(days=n)).isoformat()


call("POST", "/api/auth/register", {"email": EMAIL, "password": PASSWORD, "first_name": "Ahmad", "last_name": "Demo"})
status, tok = call("POST", "/api/auth/login", {"email": EMAIL, "password": PASSWORD})
if status != 200:
    sys.exit("Demo account exists with a different password. Delete it or change EMAIL.")
T = tok["access_token"]

_, existing = call("GET", "/api/workouts", token=T)
if existing:
    print(f"Demo account already has {len(existing)} workouts. Nothing added.")
    print(f"Log in with {EMAIL} / {PASSWORD}")
    sys.exit(0)

_, catalog = call("GET", "/api/exercises", token=T)
ex = {e["name"]: e["id"] for e in catalog}

PLANS = {
    "Push day": [("Bench press", 4, 8, 70), ("Shoulder press", 3, 10, 40), ("Tricep pushdown", 3, 12, 25), ("Push-up", 3, 15, None)],
    "Pull day": [("Deadlift", 3, 5, 120), ("Pull-up", 4, 8, None), ("Barbell row", 3, 10, 60), ("Hammer curl", 3, 12, 14)],
    "Leg day": [("Squat", 5, 5, 100), ("Romanian deadlift", 3, 10, 80), ("Leg press", 3, 12, 160), ("Standing calf raise", 4, 15, 60)],
}
schedule = [(20, "Push day", 62), (18, "Pull day", 58), (16, "Leg day", 70), (13, "Push day", 60), (11, "Pull day", 55),
            (9, "Leg day", 66), (6, "Push day", 64), (4, "Pull day", 57), (2, "Leg day", 68)]

for ago, name, minutes in schedule:
    _, w = call("POST", "/api/workouts", {"name": name, "date": day(ago), "duration": minutes}, T)
    for exercise, sets, reps, kg in PLANS[name]:
        call("POST", f"/api/workouts/{w['id']}/exercises",
             {"exercise_id": ex[exercise], "sets": sets, "reps": reps, "weight": kg}, T)
    call("POST", f"/api/workouts/{w['id']}/complete", token=T)

# Today's planned workout, so the dashboard has something to start
_, today_w = call("POST", "/api/workouts", {"name": "Push day", "date": day(0), "duration": 60}, T)
for exercise, sets, reps, kg in PLANS["Push day"]:
    call("POST", f"/api/workouts/{today_w['id']}/exercises", {"exercise_id": ex[exercise], "sets": sets, "reps": reps, "weight": kg}, T)

# Weight trend over three weeks
for ago, kg in [(21, 78.4), (17, 78.0), (14, 77.6), (10, 77.5), (7, 77.1), (3, 76.8), (0, 76.5)]:
    call("POST", "/api/weight", {"weight_kg": kg, "date": day(ago)}, T)

# Water goal and today's drinks
call("PUT", "/api/water/goal", {"daily_goal_ml": 3000}, T)
for ml in (500, 250, 330):
    call("POST", "/api/water", {"amount_ml": ml}, T)

# One gym visit today (instant check-in/out; past visits can't be back-dated through the API)
call("POST", "/api/gym/check-in", token=T)
call("POST", "/api/gym/check-out", token=T)

print(f"Demo data created: {len(schedule)} completed workouts, 1 planned, 7 weigh-ins, water, 1 gym visit.")
print(f"Log in with {EMAIL} / {PASSWORD}")
