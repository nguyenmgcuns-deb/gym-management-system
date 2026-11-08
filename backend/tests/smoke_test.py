"""End-to-end API check against a running server.

Start the server first (uvicorn app.main:app), then:
    python tests/smoke_test.py                 # run every section
    python tests/smoke_test.py crud gym        # run some sections

Set API_URL to test another address (default http://127.0.0.1:8000).
Creates throwaway users like alice_<timestamp>@example.com.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request

BASE = os.getenv("API_URL", "http://127.0.0.1:8000")
ALL_SECTIONS = ["crud", "exercises", "complete", "history", "gym", "ownership", "water", "weight"]
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
        return e.code, (json.loads(raw) if raw else None)


def check(label, method, path, expect, body=None, token=None):
    code, data = call(method, path, body, token)
    ok = code == expect
    if not ok:
        FAILS.append(label)
    short = json.dumps(data)[:140] if data is not None else ""
    print(f"{'PASS' if ok else 'FAIL'} [{code}] {label}  {short}")
    return data


def new_user(tag):
    email = f"{tag}_{int(time.time() * 1000)}@example.com"
    call("POST", "/api/auth/register",
         {"email": email, "password": "secret123", "first_name": tag, "last_name": "T"})
    _, data = call("POST", "/api/auth/login", {"email": email, "password": "secret123"})
    return data["access_token"]


A = new_user("alice")
B = new_user("bob")
sections = sys.argv[1:] or ALL_SECTIONS

# ---------- Step 8: CRUD ----------
if "crud" in sections:
    print("\n== Step 8: workout CRUD ==")
    w = check("create", "POST", "/api/workouts", 201, {"name": "Leg day"}, A)
    wid = w["id"]
    check("create with date+duration", "POST", "/api/workouts", 201,
          {"name": "Push", "date": "2026-11-01", "duration": 45}, A)
    check("create empty name", "POST", "/api/workouts", 422, {"name": ""}, A)
    check("create negative duration", "POST", "/api/workouts", 422, {"name": "x", "duration": -1}, A)
    check("create no token", "POST", "/api/workouts", 401, {"name": "x"})
    check("list", "GET", "/api/workouts", 200, token=A)
    check("get one", "GET", f"/api/workouts/{wid}", 200, token=A)
    check("get missing", "GET", "/api/workouts/99999999", 404, token=A)
    check("update name", "PUT", f"/api/workouts/{wid}", 200, {"name": "Leg day v2"}, A)
    check("update bad duration", "PUT", f"/api/workouts/{wid}", 422, {"duration": -5}, A)
    check("delete", "DELETE", f"/api/workouts/{wid}", 204, token=A)
    check("get after delete", "GET", f"/api/workouts/{wid}", 404, token=A)

# ---------- Step 9: add exercises ----------
if "exercises" in sections:
    print("\n== Step 9: add exercises ==")
    cat = check("exercise catalog", "GET", "/api/exercises", 200, token=A)
    print(f"     catalog has {len(cat)} exercises")
    check("catalog no token", "GET", "/api/exercises", 401)
    ex_id = cat[0]["id"]
    wid = check("create workout", "POST", "/api/workouts", 201, {"name": "Ex test"}, A)["id"]
    check("add exercise", "POST", f"/api/workouts/{wid}/exercises", 201,
          {"exercise_id": ex_id, "sets": 3, "reps": 10, "weight": 60}, A)
    check("add bodyweight (no weight)", "POST", f"/api/workouts/{wid}/exercises", 201,
          {"exercise_id": ex_id, "sets": 3, "reps": 12}, A)
    check("add unknown exercise", "POST", f"/api/workouts/{wid}/exercises", 404,
          {"exercise_id": 99999999, "sets": 3, "reps": 10}, A)
    check("add zero sets", "POST", f"/api/workouts/{wid}/exercises", 422,
          {"exercise_id": ex_id, "sets": 0, "reps": 10}, A)
    check("add negative weight", "POST", f"/api/workouts/{wid}/exercises", 422,
          {"exercise_id": ex_id, "sets": 3, "reps": 10, "weight": -1}, A)
    check("add to missing workout", "POST", "/api/workouts/99999999/exercises", 404,
          {"exercise_id": ex_id, "sets": 3, "reps": 10}, A)
    items = check("list workout exercises", "GET", f"/api/workouts/{wid}/exercises", 200, token=A)
    print(f"     workout has {len(items)} exercises")
    check("delete workout with exercises (cascade)", "DELETE", f"/api/workouts/{wid}", 204, token=A)

# ---------- Step 10: complete ----------
if "complete" in sections:
    print("\n== Step 10: complete workout ==")
    wid = check("create workout", "POST", "/api/workouts", 201, {"name": "To finish"}, A)["id"]
    check("complete", "POST", f"/api/workouts/{wid}/complete", 200, token=A)
    check("complete again", "POST", f"/api/workouts/{wid}/complete", 400, token=A)
    check("complete missing", "POST", "/api/workouts/99999999/complete", 404, token=A)
    check("complete no token", "POST", f"/api/workouts/{wid}/complete", 401)

# ---------- Step 11: history ----------
if "history" in sections:
    print("\n== Step 11: history ==")
    planned = check("create planned", "POST", "/api/workouts", 201, {"name": "Planned"}, A)["id"]
    done = check("create to complete", "POST", "/api/workouts", 201, {"name": "Done"}, A)["id"]
    call("POST", f"/api/workouts/{done}/complete", token=A)
    h = check("history", "GET", "/api/workouts/history", 200, token=A)
    ids = [w["id"] for w in h]
    ok = done in ids and planned not in ids and all(w["status"] == "completed" for w in h)
    print(f"{'PASS' if ok else 'FAIL'} history only has completed workouts")
    if not ok:
        FAILS.append("history filter")
    h2 = check("history limit=1", "GET", "/api/workouts/history?limit=1", 200, token=A)
    if len(h2) != 1:
        FAILS.append("history limit")
    check("history bad limit", "GET", "/api/workouts/history?limit=0", 422, token=A)
    check("history no token", "GET", "/api/workouts/history", 401)

# ---------- Step 12: gym ----------
if "gym" in sections:
    print("\n== Step 12: gym check-in/out ==")
    check("check-out before check-in", "POST", "/api/gym/check-out", 400, token=A)
    check("check-in", "POST", "/api/gym/check-in", 201, token=A)
    check("check-in twice", "POST", "/api/gym/check-in", 400, token=A)
    time.sleep(1)
    s = check("check-out", "POST", "/api/gym/check-out", 200, token=A)
    ok = s["check_out"] is not None and s["duration"] is not None and s["duration"] >= 0
    print(f"{'PASS' if ok else 'FAIL'} check-out sets check_out and duration ({s['duration']} min)")
    if not ok:
        FAILS.append("duration")
    check("check-out twice", "POST", "/api/gym/check-out", 400, token=A)
    h = check("history", "GET", "/api/gym/history", 200, token=A)
    if len(h) != 1:
        FAILS.append("gym history count")
    check("check-in no token", "POST", "/api/gym/check-in", 401)

# ---------- Step 13: ownership ----------
if "ownership" in sections:
    print("\n== Step 13: ownership (Bob vs Alice's data) ==")
    wid = check("Alice creates workout", "POST", "/api/workouts", 201, {"name": "Alice only"}, A)["id"]
    ex_id = call("GET", "/api/exercises", token=A)[1][0]["id"]
    call("POST", f"/api/workouts/{wid}/exercises",
         {"exercise_id": ex_id, "sets": 1, "reps": 1}, A)
    check("Bob reads it", "GET", f"/api/workouts/{wid}", 404, token=B)
    check("Bob edits it", "PUT", f"/api/workouts/{wid}", 404, {"name": "hacked"}, B)
    check("Bob completes it", "POST", f"/api/workouts/{wid}/complete", 404, token=B)
    check("Bob adds exercise", "POST", f"/api/workouts/{wid}/exercises", 404,
          {"exercise_id": ex_id, "sets": 1, "reps": 1}, B)
    check("Bob lists its exercises", "GET", f"/api/workouts/{wid}/exercises", 404, token=B)
    check("Bob deletes it", "DELETE", f"/api/workouts/{wid}", 404, token=B)
    bob_list = check("Bob's list", "GET", "/api/workouts", 200, token=B)
    bob_hist = check("Bob's history", "GET", "/api/workouts/history", 200, token=B)
    if any(w["id"] == wid for w in bob_list + bob_hist):
        FAILS.append("Bob sees Alice's workout in list")
        print("FAIL Bob sees Alice's workout in a list")
    w = check("Alice still has it, unchanged", "GET", f"/api/workouts/{wid}", 200, token=A)
    if w["name"] != "Alice only" or w["status"] != "planned":
        FAILS.append("Alice workout changed")
    call("POST", "/api/gym/check-in", token=A)
    check("Bob check-out doesn't close Alice's session", "POST", "/api/gym/check-out", 400, token=B)
    bob_gym = check("Bob's gym history", "GET", "/api/gym/history", 200, token=B)
    if bob_gym:
        FAILS.append("Bob sees Alice's gym sessions")
    call("POST", "/api/gym/check-out", token=A)

# ---------- Water ----------
if "water" in sections:
    print("\n== Water ==")
    g = check("default goal", "GET", "/api/water/goal", 200, token=A)
    if g["daily_goal_ml"] != 3000:
        FAILS.append("default goal")
    check("set goal", "PUT", "/api/water/goal", 200, {"daily_goal_ml": 2500}, A)
    check("goal too low", "PUT", "/api/water/goal", 422, {"daily_goal_ml": 100}, A)
    if call("GET", "/api/water/goal", token=A)[1]["daily_goal_ml"] != 2500:
        FAILS.append("goal saved")
    log = check("add 250 ml", "POST", "/api/water", 201, {"amount_ml": 250}, A)
    check("add 500 ml", "POST", "/api/water", 201, {"amount_ml": 500}, A)
    check("add 0 ml", "POST", "/api/water", 422, {"amount_ml": 0}, A)
    check("add 9000 ml", "POST", "/api/water", 422, {"amount_ml": 9000}, A)
    logs = check("list", "GET", "/api/water", 200, token=A)
    if len(logs) != 2 or logs[0]["amount_ml"] != 500:
        FAILS.append("water list newest first")
    future = check("list since future", "GET", "/api/water?since=2999-01-01T00:00:00Z", 200, token=A)
    if future:
        FAILS.append("since filter")
    check("no token", "GET", "/api/water", 401)
    # Ownership
    check("Bob deletes Alice's log", "DELETE", f"/api/water/{log['id']}", 404, token=B)
    if call("GET", "/api/water", token=B)[1]:
        FAILS.append("Bob sees Alice's water")
    if call("GET", "/api/water/goal", token=B)[1]["daily_goal_ml"] != 3000:
        FAILS.append("Bob sees Alice's goal")
    check("Alice deletes own log", "DELETE", f"/api/water/{log['id']}", 204, token=A)
    check("delete again", "DELETE", f"/api/water/{log['id']}", 404, token=A)

# ---------- Weight ----------
if "weight" in sections:
    print("\n== Weight ==")
    first = check("add today", "POST", "/api/weight", 201, {"weight_kg": 75.5}, A)
    check("add older day", "POST", "/api/weight", 201, {"weight_kg": 76.2, "date": "2026-01-10"}, A)
    same = check("same day replaces (200)", "POST", "/api/weight", 200, {"weight_kg": 75.1}, A)
    if same and same["id"] != first["id"]:
        FAILS.append("same-day replace kept id")
    check("too light", "POST", "/api/weight", 422, {"weight_kg": 5}, A)
    check("future date", "POST", "/api/weight", 422, {"weight_kg": 70, "date": "2999-01-01"}, A)
    entries = check("list", "GET", "/api/weight", 200, token=A)
    if len(entries) != 2 or entries[0]["weight_kg"] != 75.1:
        FAILS.append("weight list newest first")
    check("no token", "GET", "/api/weight", 401)
    # Ownership
    check("Bob deletes Alice's entry", "DELETE", f"/api/weight/{first['id']}", 404, token=B)
    if call("GET", "/api/weight", token=B)[1]:
        FAILS.append("Bob sees Alice's weight")
    check("Alice deletes own entry", "DELETE", f"/api/weight/{first['id']}", 204, token=A)

print("\nRESULT:", "ALL PASSED" if not FAILS else f"{len(FAILS)} FAILED: {FAILS}")
sys.exit(1 if FAILS else 0)
