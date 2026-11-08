from pydantic import BaseModel, ConfigDict


class ExerciseResponse(BaseModel):
    id: int
    name: str
    muscle_group: str

    model_config = ConfigDict(from_attributes=True)