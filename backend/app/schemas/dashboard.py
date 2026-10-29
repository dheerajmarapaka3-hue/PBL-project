from pydantic import BaseModel
from app.schemas.measurement import MeasurementSummary
from app.schemas.medicine import MedicineDoseResponse
from app.schemas.routine import RoutineResponse
from app.schemas.document import DocumentResponse


class VitalityBreakdown(BaseModel):
    total_score: int
    status_label: str  # e.g., "Radiant", "Optimal", "Good", "Needs Focus"
    percentile: str  # e.g., "Top 5% Peak"
    hydration_score: int
    hydration_max: int = 20
    sleep_score: int
    sleep_max: int = 25
    routine_score: int
    routine_max: int = 25
    activity_score: int
    activity_max: int = 15
    vitals_score: int
    vitals_max: int = 15
    has_sufficient_data: bool
    explanation: str


class DashboardSummaryResponse(BaseModel):
    user_name: str
    greeting: str
    today_date: str
    vitality: VitalityBreakdown
    proactive_insight: dict
    vitals_summary: list[MeasurementSummary]
    today_doses: list[MedicineDoseResponse]
    today_routines: list[RoutineResponse]
    nutrition_summary: dict
    recent_documents: list[DocumentResponse]
    weekly_active_minutes: int
