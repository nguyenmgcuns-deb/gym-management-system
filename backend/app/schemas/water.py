from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

DEFAULT_WATER_GOAL_ML = 3000


class WaterLogCreate(BaseModel):
    amount_ml: int = Field(gt=0, le=5000)


class WaterLogResponse(BaseModel):
    id: int
    amount_ml: int
    logged_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WaterGoal(BaseModel):
    daily_goal_ml: int = Field(ge=500, le=10000)
