import datetime
from pydantic import BaseModel, ConfigDict, Field


class MeasurementCreate(BaseModel):
    type: str = Field(..., description="weight, blood_pressure, heart_rate, blood_glucose, body_temp, sleep, water, steps")
    value_primary: float
    value_secondary: float | None = None
    unit: str
    notes: str | None = None
    recorded_at: datetime.datetime | None = None


class MeasurementUpdate(BaseModel):
    value_primary: float | None = None
    value_secondary: float | None = None
    unit: str | None = None
    notes: str | None = None
    recorded_at: datetime.datetime | None = None


class MeasurementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    type: str
    value_primary: float
    value_secondary: float | None = None
    unit: str
    notes: str | None = None
    recorded_at: datetime.datetime
    created_at: datetime.datetime


class MeasurementTrendPoint(BaseModel):
    date: str
    value_primary: float
    value_secondary: float | None = None


class MeasurementSummary(BaseModel):
    type: str
    unit: str
    latest_value_primary: float | None = None
    latest_value_secondary: float | None = None
    latest_date: str | None = None
    average: float | None = None
    min: float | None = None
    max: float | None = None
    normal_range: str | None = None
    status: str | None = None  # Normal, Elevated, Low, Optimal
    history: list[MeasurementTrendPoint] = []
