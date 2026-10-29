import datetime
from pydantic import BaseModel, ConfigDict


class ExerciseCreate(BaseModel):
    activity_type: str
    duration_minutes: int
    calories_burned: float = 0.0
    intensity: str = "Moderate"
    notes: str | None = None
    recorded_at: datetime.datetime | None = None


class ExerciseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    activity_type: str
    duration_minutes: int
    calories_burned: float
    intensity: str
    notes: str | None = None
    recorded_at: datetime.datetime
    created_at: datetime.datetime


class MeditationComplete(BaseModel):
    session_name: str
    session_type: str = "Breathing"
    duration_minutes: int
    notes: str | None = None


class MeditationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    session_name: str
    session_type: str
    duration_minutes: int
    notes: str | None = None
    completed_at: datetime.datetime
    created_at: datetime.datetime


class WorkoutStatsResponse(BaseModel):
    weekly_active_minutes: int
    target_active_minutes: int
    total_workouts_count: int
    total_calories_burned: float
    recent_workouts: list[ExerciseResponse]
