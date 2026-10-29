import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserProfileUpdate(BaseModel):
    dob: str | None = None
    gender: str | None = None
    height: float | None = None
    weight: float | None = None
    blood_group: str | None = None
    unit_preference: str = "metric"
    activity_level: str | None = None
    dietary_preference: str | None = None
    allergies: str | None = None
    medical_conditions: str | None = None
    health_goals: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    target_water_ml: int | None = 2500
    target_sleep_hours: float | None = 8.0
    target_steps: int | None = 8000
    target_calories: int | None = 2000


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    dob: str | None = None
    gender: str | None = None
    height: float | None = None
    weight: float | None = None
    blood_group: str | None = None
    unit_preference: str = "metric"
    activity_level: str | None = None
    dietary_preference: str | None = None
    allergies: str | None = None
    medical_conditions: str | None = None
    health_goals: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    target_water_ml: int = 2500
    target_sleep_hours: float = 8.0
    target_steps: int = 8000
    target_calories: int = 2000


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    is_active: bool
    created_at: datetime.datetime
    profile: UserProfileResponse | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
