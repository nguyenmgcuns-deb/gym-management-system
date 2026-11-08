"""Security check: one user must never see or change another user's data.

Start the server first (uvicorn app.main:app), then:
    python tests/security_test.py
Set API_URL to test another address (default http://127.0.0.1:8000).
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
from dotenv import load_dotenv

BASE = os.getenv("API_URL", "http://127.0.0.1:8000")
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
FAILS = []


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
        raw = e.read()
        try:
            return e.code, (json.loads(raw) if raw else None)
        except ValueError:
            return e.code, None


def expect(label, ok, extra=""):
    if not ok:
        FAILS.append(label)
    print(f"{'PASS' if ok else 'FAIL'} {label}{('  ' + extra) if extra else ''}")


def expect_status(label, method, path, status, body=None, token=None):
    code, data = call(method, path, body, token)
    expect(label, code == status, f"[{code}]")
    return data


def new_user(tag):
    email = f"{tag}_{int(time.time() * 1000)}@example.com"
    call("POST", "/api/auth/register", {"email": email, "password": "secret123", "first_name": tag, "last_name": "S"})
    _, data = call("POST", "/api/auth/login", {"email": email, "password": "secret123"})
    _, me = call("GET", "/api/users/me", token=data["access_token"])
    return data["access_token"], me


A, alice = new_user("alice")
B, bob = new_user("bob")

# ---------- Alice creates one of everything ----------
_, exercises = call("GET", "/api/exercises", token=A)
_, w = call("POST", "/api/workouts", {"name": "Alice private", "duration": 30}, A)
_, item = call("POST", f"/api/workouts/{w['id']}/exercises", {"exercise_id": exercises[0]["id"], "sets": 3, "reps": 5}, A)
_, done = call("POST", "/api/workouts", {"name": "Alice done"}, A)
call("POST", f"/api/workouts/{done['id']}/complete", token=A)
call("POST", "/api/gym/check-in", token=A)
call("POST", "/api/gym/check-out", token=A)
call("POST", "/api/gym/check-in", token=A)  # leave one session open
_, water = call("POST", "/api/water", {"amount_ml": 400}, A)
call("PUT", "/api/water/goal", {"daily_goal_ml": 2200}, A)
_, weight = call("POST", "/api/weight", {"weight_kg": 66.6}, A)

print("\n== Workouts ==")
expect_status("Bob reads Alice's workout", "GET", f"/api/workouts/{w['id']}", 404, token=B)
expect_status("Bob edits Alice's workout", "PUT", f"/api/workouts/{w['id']}", 404, {"name": "x"}, B)
expect_status("Bob completes Alice's workout", "POST", f"/api/workouts/{w['id']}/complete", 404, token=B)
expect_status("Bob deletes Alice's workout", "DELETE", f"/api/workouts/{w['id']}", 404, token=B)
expect_status("Bob lists Alice's workout exercises", "GET", f"/api/workouts/{w['id']}/exercises", 404, token=B)
expect_status("Bob adds exercise to Alice's workout", "POST", f"/api/workouts/{w['id']}/exercises", 404,
              {"exercise_id": exercises[0]["id"], "sets": 1, "reps": 1}, B)
_, bob_list = call("GET", "/api/workouts", token=B)
_, bob_hist = call("GET", "/api/workouts/history", token=B)
expect("Bob's workout list has none of Alice's", bob_list == [], f"{len(bob_list)} items")
expect("Bob's history has none of Alice's", bob_hist == [], f"{len(bob_hist)} items")
_, still = call("GET", f"/api/workouts/{w['id']}", token=A)
_, items = call("GET", f"/api/workouts/{w['id']}/exercises", token=A)
expect("Alice's workout unchanged", still["name"] == "Alice private" and still["status"] == "planned" and len(items) == 1)

print("\n== Gym sessions ==")
_, bob_gym = call("GET", "/api/gym/history", token=B)
expect("Bob's gym history is empty", bob_gym == [], f"{len(bob_gym)} items")
expect_status("Bob can't check out Alice's open session", "POST", "/api/gym/check-out", 400, token=B)
expect_status("Bob can check in for himself", "POST", "/api/gym/check-in", 201, token=B)
_, alice_gym = call("GET", "/api/gym/history", token=A)
expect("Alice still has 2 sessions, one open", len(alice_gym) == 2 and alice_gym[0]["check_out"] is None)
call("POST", "/api/gym/check-out", token=A)
call("POST", "/api/gym/check-out", token=B)

print("\n== Water ==")
_, bob_water = call("GET", "/api/water?since=2000-01-01T00:00:00Z", token=B)
expect("Bob's water logs are empty", bob_water == [], f"{len(bob_water)} items")
expect_status("Bob deletes Alice's water log", "DELETE", f"/api/water/{water['id']}", 404, token=B)
_, bob_goal = call("GET", "/api/water/goal", token=B)
expect("Bob's goal isn't Alice's", bob_goal["daily_goal_ml"] == 3000)
call("PUT", "/api/water/goal", {"daily_goal_ml": 4000}, B)
_, alice_goal = call("GET", "/api/water/goal", token=A)
expect("Bob changing his goal doesn't touch Alice's", alice_goal["daily_goal_ml"] == 2200)
_, alice_water = call("GET", "/api/water", token=A)
expect("Alice's water log still there", any(x["id"] == water["id"] for x in alice_water))

print("\n== Weight ==")
_, bob_weight = call("GET", "/api/weight", token=B)
expect("Bob's weight list is empty", bob_weight == [], f"{len(bob_weight)} items")
expect_status("Bob deletes Alice's weight", "DELETE", f"/api/weight/{weight['id']}", 404, token=B)
expect_status("Bob logs his own weight for the same day", "POST", "/api/weight", 201, {"weight_kg": 90}, B)
_, alice_weight = call("GET", "/api/weight", token=A)
expect("Alice's weight unchanged", len(alice_weight) == 1 and alice_weight[0]["weight_kg"] == 66.6)

print("\n== Profile ==")
call("PUT", "/api/users/me", {"first_name": "Robert"}, B)
_, alice_me = call("GET", "/api/users/me", token=A)
expect("Bob's profile change doesn't touch Alice", alice_me["first_name"] == "alice")
_, me_b = call("GET", "/api/users/me", token=B)
expect("/me never returns password_hash", "password_hash" not in me_b and "password" not in me_b)

print("\n== Tokens ==")
secret = os.getenv("SECRET_KEY")
alg = os.getenv("ALGORITHM", "HS256")
in_hour = datetime.now(timezone.utc) + timedelta(hours=1)
forged = jwt.encode({"sub": str(alice["id"]), "exp": in_hour}, "not-the-real-key-but-long-enough-0123456789", algorithm="HS256")
unsigned = jwt.encode({"sub": str(alice["id"]), "exp": in_hour}, None, algorithm="none")
expired = jwt.encode({"sub": str(alice["id"]), "exp": datetime.now(timezone.utc) - timedelta(minutes=1)}, secret, algorithm=alg)
no_sub = jwt.encode({"exp": in_hour}, secret, algorithm=alg)
for label, tok in [("forged signature", forged), ("alg=none", unsigned), ("expired", expired),
                   ("no subject", no_sub), ("garbage", "abc.def.ghi")]:
    expect_status(f"{label} token rejected", "GET", "/api/workouts", 401, token=tok)
for path in ["/api/workouts", "/api/gym/history", "/api/water", "/api/weight", "/api/users/me", "/api/exercises"]:
    expect_status(f"no token on {path}", "GET", path, 401)

print("\nRESULT:", "ALL PASSED" if not FAILS else f"{len(FAILS)} FAILED: {FAILS}")
sys.exit(1 if FAILS else 0)
