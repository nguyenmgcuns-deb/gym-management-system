from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.workout import Workout
from app.schemas.workout import WorkoutCreate, WorkoutResponse, WorkoutUpdate
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