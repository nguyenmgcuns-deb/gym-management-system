from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class WaterLog(Base):
    """One drink: amount in ml at a moment in time."""

    __tablename__ = "water_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount_ml = Column(Integer, nullable=False)
    logged_at = Column(DateTime(timezone=True), nullable=False, default=utc_now, index=True)


class WaterGoal(Base):
    """Daily water goal per user (own table so the users table doesn't need a migration)."""

    __tablename__ = "water_goals"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    daily_goal_ml = Column(Integer, nullable=False)
