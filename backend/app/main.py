from fastapi import FastAPI

from app import models  # noqa: F401  (loads the User model)
from app.database import Base, engine
from app.routers import auth, users

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Gym Tracker API")

app.include_router(auth.router)


@app.get("/")
def health_check():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(users.router)