import datetime as dt

from pydantic import BaseModel, ConfigDict, Field


# ---------- Workout ----------
class WorkoutCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    date: dt.date | None = None  # empty -> model default (today)
    duration: int | None = Field(default=None, ge=0)


class WorkoutUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    date: dt.date | None = None
    duration: int | None = Field(default=None, ge=0)


class WorkoutResponse(BaseModel):
    id: int
    name: str
    date: dt.date
    duration: int | None
    status: str

    model_config = ConfigDict(from_attributes=True)


# ---------- Exercise inside a workout ----------
class WorkoutExerciseCreate(BaseModel):
    exercise_id: int
    sets: int = Field(gt=0)
    reps: int = Field(gt=0)
    weight: float | None = Field(default=None, ge=0)


class WorkoutExerciseResponse(BaseModel):
    id: int
    workout_id: int
    exercise_id: int
    sets: int
    reps: int
    weight: float | None

    model_config = ConfigDict(from_attributes=True)