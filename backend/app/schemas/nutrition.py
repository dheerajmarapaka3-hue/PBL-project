import datetime
from pydantic import BaseModel, ConfigDict


class FoodEntryCreate(BaseModel):
    meal_type: str  # breakfast, lunch, dinner, snack
    food_name: str
    portion: str = "1 serving"
    calories: float = 0.0
    protein_g: float = 0.0
    carbs_g: float = 0.0
    fat_g: float = 0.0
    notes: str | None = None
    recorded_at: datetime.datetime | None = None


class FoodEntryUpdate(BaseModel):
    meal_type: str | None = None
    food_name: str | None = None
    portion: str | None = None
    calories: float | None = None
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None
    notes: str | None = None
    recorded_at: datetime.datetime | None = None


class FoodEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    meal_type: str
    food_name: str
    portion: str
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    notes: str | None = None
    recorded_at: datetime.datetime
    created_at: datetime.datetime


class NutritionSummaryResponse(BaseModel):
    date: str
    total_calories: float
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float
    target_calories: int
    water_intake_ml: int
    target_water_ml: int
    meals_by_type: dict[str, list[FoodEntryResponse]]
