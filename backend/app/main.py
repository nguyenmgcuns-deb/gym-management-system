from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, exercises, gym, users, workouts
from app.database import engine, Base, SessionLocal
from app.seed import seed_exercises

Base.metadata.create_all(bind=engine)
db = SessionLocal()
try:
    seed_exercises(db)
finally:
    db.close()

app = FastAPI(title="Gym Tracker API")

# Allow the frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace "*" with your frontend URL (e.g., "http://localhost:5173")
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(workouts.router)
app.include_router(exercises.router)
app.include_router(gym.router)

@app.get("/")
def health_check():
    return {"status": "ok"}
