from sqlalchemy.orm import Session

from app.models.exercise import Exercise

# (name, muscle_group) pairs
DEFAULT_EXERCISES = [
    ("Bench press", "Chest"),
    ("Squat", "Legs"),
    ("Deadlift", "Back"),
    ("Pull-up", "Back"),
    # add your 4+ here, e.g. ("Shoulder press", "Shoulders"),
]


def seed_exercises(db: Session) -> None:
    """Insert each default exercise once. Safe to run on every startup."""
    for name, muscle_group in DEFAULT_EXERCISES:
        exists = db.query(Exercise).filter(Exercise.name == name).first()
        if exists is None:
            db.add(Exercise(name=name, muscle_group=muscle_group))
    db.commit()