from datetime import datetime

from pydantic import BaseModel, ConfigDict


class GymSessionResponse(BaseModel):
    id: int
    check_in: datetime
    check_out: datetime | None
    duration: int | None

    model_config = ConfigDict(from_attributes=True)