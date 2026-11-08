import datetime as dt

from pydantic import BaseModel, ConfigDict, Field, field_validator


class WeightLogCreate(BaseModel):
    weight_kg: float = Field(ge=20, le=400)
    date: dt.date | None = None  # empty -> today

    @field_validator("date")
    @classmethod
    def not_in_future(cls, value: dt.date | None) -> dt.date | None:
        # One day of slack so users ahead of the server's time zone aren't blocked
        if value is not None and value > dt.date.today() + dt.timedelta(days=1):
            raise ValueError("Date can't be in the future")
        return value


class WeightLogResponse(BaseModel):
    id: int
    weight_kg: float
    date: dt.date

    model_config = ConfigDict(from_attributes=True)
