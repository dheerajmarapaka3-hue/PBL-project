import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.nutrition import FoodEntry
from app.models.measurement import HealthMeasurement
from app.schemas.nutrition import (
    FoodEntryCreate,
    FoodEntryUpdate,
    FoodEntryResponse,
    NutritionSummaryResponse,
)
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/nutrition", tags=["Nutrition and Food Diary"])


@router.post("/meals", response_model=FoodEntryResponse, status_code=status.HTTP_201_CREATED)
def log_meal(
    meal_in: FoodEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    recorded_at = meal_in.recorded_at or datetime.datetime.utcnow()
    entry = FoodEntry(
        user_id=current_user.id,
        meal_type=meal_in.meal_type.lower().strip(),
        food_name=meal_in.food_name.strip(),
        portion=meal_in.portion.strip(),
        calories=meal_in.calories,
        protein_g=meal_in.protein_g,
        carbs_g=meal_in.carbs_g,
        fat_g=meal_in.fat_g,
        notes=meal_in.notes,
        recorded_at=recorded_at,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return FoodEntryResponse.model_validate(entry)


@router.get("/meals", response_model=list[FoodEntryResponse])
def list_meals(
    date: str | None = Query(None, description="YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(FoodEntry).filter(FoodEntry.user_id == current_user.id)
    if date:
        try:
            target_date = datetime.date.fromisoformat(date)
            start_dt = datetime.datetime.combine(target_date, datetime.time.min)
            end_dt = datetime.datetime.combine(target_date, datetime.time.max)
            query = query.filter(FoodEntry.recorded_at >= start_dt, FoodEntry.recorded_at <= end_dt)
        except Exception:
            pass

    entries = query.order_by(FoodEntry.recorded_at.desc()).all()
    return [FoodEntryResponse.model_validate(e) for e in entries]


@router.put("/meals/{meal_id}", response_model=FoodEntryResponse)
def update_meal(
    meal_id: int,
    meal_in: FoodEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = db.query(FoodEntry).filter(FoodEntry.id == meal_id, FoodEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Food entry not found or unauthorized.")

    for field, val in meal_in.model_dump(exclude_unset=True).items():
        setattr(entry, field, val)

    db.commit()
    db.refresh(entry)
    return FoodEntryResponse.model_validate(entry)


@router.delete("/meals/{meal_id}", status_code=status.HTTP_200_OK)
def delete_meal(
    meal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = db.query(FoodEntry).filter(FoodEntry.id == meal_id, FoodEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Food entry not found or unauthorized.")

    db.delete(entry)
    db.commit()
    return {"message": "Food entry removed successfully."}


@router.get("/daily-summary", response_model=NutritionSummaryResponse)
def get_daily_summary(
    date: str | None = Query(None, description="YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target_date = datetime.date.fromisoformat(date) if date else datetime.date.today()
    start_dt = datetime.datetime.combine(target_date, datetime.time.min)
    end_dt = datetime.datetime.combine(target_date, datetime.time.max)

    entries = (
        db.query(FoodEntry)
        .filter(
            FoodEntry.user_id == current_user.id,
            FoodEntry.recorded_at >= start_dt,
            FoodEntry.recorded_at <= end_dt,
        )
        .all()
    )

    total_cal = sum(e.calories for e in entries)
    total_pro = sum(e.protein_g for e in entries)
    total_car = sum(e.carbs_g for e in entries)
    total_fat = sum(e.fat_g for e in entries)

    # Water intake today
    water_records = (
        db.query(HealthMeasurement)
        .filter(
            HealthMeasurement.user_id == current_user.id,
            HealthMeasurement.type == "water",
            HealthMeasurement.recorded_at >= start_dt,
            HealthMeasurement.recorded_at <= end_dt,
        )
        .all()
    )
    water_total = int(sum(r.value_primary for r in water_records))

    meals_grouped: dict[str, list[FoodEntryResponse]] = {
        "breakfast": [],
        "lunch": [],
        "dinner": [],
        "snack": [],
    }
    for e in entries:
        t = e.meal_type.lower()
        if t not in meals_grouped:
            meals_grouped[t] = []
        meals_grouped[t].append(FoodEntryResponse.model_validate(e))

    target_cal = current_user.profile.target_calories if current_user.profile else 2000
    target_water = current_user.profile.target_water_ml if current_user.profile else 2500

    return NutritionSummaryResponse(
        date=target_date.isoformat(),
        total_calories=round(total_cal, 1),
        total_protein_g=round(total_pro, 1),
        total_carbs_g=round(total_car, 1),
        total_fat_g=round(total_fat, 1),
        target_calories=target_cal,
        water_intake_ml=water_total,
        target_water_ml=target_water,
        meals_by_type=meals_grouped,
    )
