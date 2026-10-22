from fastapi import FastAPI

app = FastAPI(title="Gym Tracker API")


@app.get("/")
def health_check():
    return {"status": "ok"}