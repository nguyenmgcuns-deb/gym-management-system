from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.exercise import Exercise
from app.models.user import User
from app.models.workout import Workout
from app.models.workout_exercise import WorkoutExercise
from app.schemas.workout import (
    WorkoutCreate,
    WorkoutExerciseCreate,
    WorkoutExerciseResponse,
    WorkoutResponse,
    WorkoutUpdate,
)
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/workouts", tags=["Workouts"])


def get_own_workout(workout_id: int, db: Session, user: User) -> Workout:
    """Load one workout that belongs to this user, or raise 404."""
    workout = (
        db.query(Workout)
        .filter(Workout.id == workout_id, Workout.user_id == user.id)
        .first()
    )
    if workout is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found",
        )
    return workout


@router.get("", response_model=list[WorkoutResponse])
def list_workouts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """All workouts of the logged-in user, newest first."""
    return (
        db.query(Workout)
        .filter(Workout.user_id == current_user.id)
        .order_by(Workout.date.desc(), Workout.id.desc())
        .all()
    )


# Must stay above "/{workout_id}", otherwise "history" is read as an id
@router.get("/history", response_model=list[WorkoutResponse])
def workout_history(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """The user's most recent completed workouts, newest first."""
    return (
        db.query(Workout)
        .filter(Workout.user_id == current_user.id, Workout.status == "completed")
        .order_by(Workout.date.desc(), Workout.id.desc())
        .limit(limit)
        .all()
    )


@router.post("", response_model=WorkoutResponse, status_code=status.HTTP_201_CREATED)
def create_workout(
    workout_in: WorkoutCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a workout owned by the logged-in user."""
    data = workout_in.model_dump(exclude_none=True)  # no date sent -> model default (today)
    workout = Workout(**data, user_id=current_user.id)
    db.add(workout)
    db.commit()
    db.refresh(workout)
    return workout


@router.get("/{workout_id}", response_model=WorkoutResponse)
def read_workout(
    workout_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """One workout, only if it belongs to the logged-in user."""
    return get_own_workout(workout_id, db, current_user)


@router.put("/{workout_id}", response_model=WorkoutResponse)
def update_workout(
    workout_id: int,
    workout_in: WorkoutUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change name, date and/or duration. Only the sent fields change."""
    workout = get_own_workout(workout_id, db, current_user)
    changes = workout_in.model_dump(exclude_unset=True, exclude_none=True)
    for field, value in changes.items():
        setattr(workout, field, value)
    db.commit()
    db.refresh(workout)
    return workout


@router.delete("/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workout(
    workout_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a workout (its exercise rows are removed by ON DELETE CASCADE)."""
    workout = get_own_workout(workout_id, db, current_user)
    db.delete(workout)
    db.commit()


# ---------- Exercises inside a workout ----------
@router.post(
    "/{workout_id}/exercises",
    response_model=WorkoutExerciseResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_exercise_to_workout(
    workout_id: int,
    item_in: WorkoutExerciseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add one exercise (with sets, reps, weight) to the user's workout."""
    workout = get_own_workout(workout_id, db, current_user)

    if db.get(Exercise, item_in.exercise_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found",
        )

    item = WorkoutExercise(**item_in.model_dump(), workout_id=workout.id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/{workout_id}/exercises", response_model=list[WorkoutExerciseResponse])
def list_workout_exercises(
    workout_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """All exercises added to the user's workout, in the order they were added."""
    workout = get_own_workout(workout_id, db, current_user)
    return (
        db.query(WorkoutExercise)
        .filter(WorkoutExercise.workout_id == workout.id)
        .order_by(WorkoutExercise.id)
        .all()
    )


# ---------- Complete ----------
@router.post("/{workout_id}/complete", response_model=WorkoutResponse)
def complete_workout(
    workout_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark the user's workout as completed (only once)."""
    workout = get_own_workout(workout_id, db, current_user)
    if workout.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workout is already completed",
        )
    workout.status = "completed"
    db.commit()
    db.refresh(workout)
    return workout
