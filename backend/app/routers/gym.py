from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.gym_sessions import GymSession
from app.models.user import User
from app.schemas.gym_session import GymSessionResponse
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/gym", tags=["Gym"])


def get_open_session(db: Session, user: User) -> GymSession | None:
    """The user's current visit (checked in, not yet checked out), if any."""
    return (
        db.query(GymSession)
        .filter(GymSession.user_id == user.id, GymSession.check_out.is_(None))
        .first()
    )


@router.post("/check-in", response_model=GymSessionResponse, status_code=status.HTTP_201_CREATED)
def check_in(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start a gym visit. Only one open visit per user."""
    if get_open_session(db, current_user) is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already checked in",
        )
    session = GymSession(user_id=current_user.id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.post("/check-out", response_model=GymSessionResponse)
def check_out(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """End the current visit and store its length in minutes."""
    session = get_open_session(db, current_user)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not checked in",
        )
    session.check_out = datetime.now(timezone.utc)
    session.duration = int((session.check_out - session.check_in).total_seconds() // 60)
    db.commit()
    db.refresh(session)
    return session


@router.get("/history", response_model=list[GymSessionResponse])
def gym_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """All of the user's gym visits, newest first."""
    return (
        db.query(GymSession)
        .filter(GymSession.user_id == current_user.id)
        .order_by(GymSession.check_in.desc())
        .all()
    )
