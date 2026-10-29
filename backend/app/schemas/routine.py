import datetime
from pydantic import BaseModel, ConfigDict


class RoutineCreate(BaseModel):
    title: str
    category: str = "Morning"  # Morning, Afternoon, Evening, Anytime
    target_time: str | None = None
    recurrence: str = "daily"  # daily, weekdays, weekends
    icon: str = "check_circle"


class RoutineUpdate(BaseModel):
    title: str | None = None
    category: str | None = None
    target_time: str | None = None
    recurrence: str | None = None
    icon: str | None = None
    is_active: bool | None = None


class RoutineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    category: str
    target_time: str | None = None
    recurrence: str
    icon: str
    is_active: bool
    completed_today: bool = False
    streak_days: int = 0
    created_at: datetime.datetime


class RoutineSuggestionRequest(BaseModel):
    goal_prompt: str


class ProposedRoutineItem(BaseModel):
    title: str
    category: str
    target_time: str | None = None
    recurrence: str = "daily"
    icon: str = "spa"
    reason: str


class RoutineSuggestionResponse(BaseModel):
    plan_title: str
    plan_description: str
    proposed_routines: list[ProposedRoutineItem]


class GoalCreate(BaseModel):
    title: str
    category: str = "activity"
    target_value: float
    current_value: float = 0.0
    unit: str
    deadline: str | None = None


class GoalUpdate(BaseModel):
    title: str | None = None
    category: str | None = None
    target_value: float | None = None
    current_value: float | None = None
    unit: str | None = None
    deadline: str | None = None
    status: str | None = None


class GoalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    category: str
    target_value: float
    current_value: float
    unit: str
    deadline: str | None = None
    status: str
    created_at: datetime.datetime
