from datetime import date

from sqlalchemy import Column, Date, ForeignKey, Integer, String
from app.database import Base


class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    name = Column(String, nullable=False)
    date = Column(Date, nullable=False, default=date.today)
    duration = Column(Integer, nullable=True)
    status = Column(String, nullable=False, default="planned")