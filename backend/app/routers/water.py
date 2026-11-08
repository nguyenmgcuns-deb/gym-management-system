from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.water import WaterGoal, WaterLog
from app.schemas.water import DEFAULT_WATER_GOAL_ML, WaterGoal as WaterGoalSchema
from app.schemas.water import WaterLogCreate, WaterLogResponse
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/water", tags=["Water"])


# ---------- Goal (above "/{log_id}" so "goal" isn't read as an id) ----------
@router.get("/goal", response_model=WaterGoalSchema)
def read_goal(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """The user's daily goal in ml (3000 until they set one)."""
    goal = db.get(WaterGoal, current_user.id)
    return WaterGoalSchema(daily_goal_ml=goal.daily_goal_ml if goal else DEFAULT_WATER_GOAL_ML)


@router.put("/goal", response_model=WaterGoalSchema)
def update_goal(
    goal_in: WaterGoalSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Set the daily goal (500-10000 ml)."""
    goal = db.get(WaterGoal, current_user.id)
    if goal is None:
        goal = WaterGoal(user_id=current_user.id, daily_goal_ml=goal_in.daily_goal_ml)
        db.add(goal)
    else:
        goal.daily_goal_ml = goal_in.daily_goal_ml
    db.commit()
    return WaterGoalSchema(daily_goal_ml=goal.daily_goal_ml)


# ---------- Logs ----------
@router.get("", response_model=list[WaterLogResponse])
def list_logs(
    since: datetime | None = Query(
        default=None,
        description="Only logs at or after this time (ISO 8601). Default: last 7 days.",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """The user's water logs, newest first. The client groups them into its own local days."""
    if since is None:
        since = datetime.now(timezone.utc) - timedelta(days=7)
    elif since.tzinfo is None:
        since = since.replace(tzinfo=timezone.utc)
    return (
        db.query(WaterLog)
        .filter(WaterLog.user_id == current_user.id, WaterLog.logged_at >= since)
        .order_by(WaterLog.logged_at.desc(), WaterLog.id.desc())
        .all()
    )


@router.post("", response_model=WaterLogResponse, status_code=status.HTTP_201_CREATED)
def add_log(
    log_in: WaterLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Log a drink (1-5000 ml), timestamped now."""
    log = WaterLog(user_id=current_user.id, amount_ml=log_in.amount_ml)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete one of the user's own logs. Other users' logs return 404."""
    log = (
        db.query(WaterLog)
        .filter(WaterLog.id == log_id, WaterLog.user_id == current_user.id)
        .first()
    )
    if log is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Water log not found")
    db.delete(log)
    db.commit()
