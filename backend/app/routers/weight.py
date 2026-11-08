from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.weight import WeightLog
from app.schemas.weight import WeightLogCreate, WeightLogResponse
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/weight", tags=["Weight"])


@router.get("", response_model=list[WeightLogResponse])
def list_weights(
    limit: int = Query(default=100, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """The user's weigh-ins, newest date first."""
    return (
        db.query(WeightLog)
        .filter(WeightLog.user_id == current_user.id)
        .order_by(WeightLog.date.desc())
        .limit(limit)
        .all()
    )


@router.post("", response_model=WeightLogResponse, status_code=status.HTTP_201_CREATED)
def add_weight(
    entry_in: WeightLogCreate,
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record weight for a day (default today). A second entry for the same day
    replaces the first and returns 200 instead of 201."""
    day = entry_in.date or date.today()
    entry = (
        db.query(WeightLog)
        .filter(WeightLog.user_id == current_user.id, WeightLog.date == day)
        .first()
    )
    if entry is None:
        entry = WeightLog(user_id=current_user.id, weight_kg=entry_in.weight_kg, date=day)
        db.add(entry)
    else:
        entry.weight_kg = entry_in.weight_kg
        response.status_code = status.HTTP_200_OK
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_weight(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete one of the user's own weigh-ins. Other users' entries return 404."""
    entry = (
        db.query(WeightLog)
        .filter(WeightLog.id == entry_id, WeightLog.user_id == current_user.id)
        .first()
    )
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weight entry not found")
    db.delete(entry)
    db.commit()
