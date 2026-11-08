from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.exercise import Exercise
from app.schemas.exercise import ExerciseResponse
from app.utils.dependencies import get_current_user

router = APIRouter(
    prefix="/api/exercises",
    tags=["Exercises"],
    dependencies=[Depends(get_current_user)],  # logged-in users only
)


@router.get("", response_model=list[ExerciseResponse])
def list_exercises(db: Session = Depends(get_db)):
    """The exercise catalog (seed data), grouped by muscle group then name."""
    return db.query(Exercise).order_by(Exercise.muscle_group, Exercise.name).all()
