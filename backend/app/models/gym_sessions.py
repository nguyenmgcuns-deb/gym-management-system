from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class GymSession(Base):
    __tablename__ = "gym_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    check_in = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    check_out = Column(DateTime(timezone=True), nullable=True)
    duration = Column(Integer, nullable=True)