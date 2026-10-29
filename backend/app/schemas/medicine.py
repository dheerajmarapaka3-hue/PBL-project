import datetime
from pydantic import BaseModel, ConfigDict


class MedicineCreate(BaseModel):
    name: str
    dosage: str
    form: str = "Tablet"
    instructions: str = "Take with water"
    frequency: str = "Daily"
    schedule_times: str = "08:00"
    start_date: str
    end_date: str | None = None
    notes: str | None = None


class MedicineUpdate(BaseModel):
    name: str | None = None
    dosage: str | None = None
    form: str | None = None
    instructions: str | None = None
    frequency: str | None = None
    schedule_times: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    is_active: bool | None = None
    notes: str | None = None


class MedicineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    dosage: str
    form: str
    instructions: str
    frequency: str
    schedule_times: str
    start_date: str
    end_date: str | None = None
    is_active: bool
    notes: str | None = None
    created_at: datetime.datetime


class MedicineDoseResponse(BaseModel):
    id: int
    medicine_id: int
    medicine_name: str
    dosage: str
    form: str
    instructions: str
    scheduled_date: str
    scheduled_time: str
    status: str  # pending, taken, skipped
    taken_at: datetime.datetime | None = None
    notes: str | None = None


class DoseStatusUpdate(BaseModel):
    status: str  # taken, skipped, pending
    notes: str | None = None
