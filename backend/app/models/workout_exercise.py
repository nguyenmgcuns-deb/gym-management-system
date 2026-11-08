from sqlalchemy import Column, Float, ForeignKey, Integer
from app.database import Base


class WorkoutExercise(Base):
    __tablename__ = "workout_exercises"

    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(
        Integer,
        ForeignKey("workouts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)