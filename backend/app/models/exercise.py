from sqlalchemy import Column, Integer, String   # String = text column type
from app.database import Base                    # Base = parent of every model


class Exercise(Base):                            # inherit from Base → becomes a table
    __tablename__ = "exercises"                  # real table name in PostgreSQL

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)        # "Squat" only once, never empty
    muscle_group = Column(String, nullable=False)             # "Legs", never empty