from sqlalchemy.orm import Session

from app.models.exercise import Exercise

# (name, muscle_group) pairs
DEFAULT_EXERCISES = [
    ("Bench press", "Chest"),
    ("Squat", "Legs"),
    ("Deadlift", "Back"),
    ("Pull-up", "Back"),
    # TODO: add at least 4 more, e.g. shoulders, arms, core
]


def seed_exercises(db: Session) -> None:
    """Insert default exercises once. Safe to run on every startup."""
    # 1. If the table already has data, do nothing
    if db.query(Exercise).first() is not None:
        return

    # 2. Add every default exercise
    for name, muscle_group in DEFAULT_EXERCISES:
        db.add(Exercise(name=name, muscle_group=muscle_group))

    # 3. Save all of them in one go
    db.commit()