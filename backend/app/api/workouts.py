import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.activity import ExerciseLog
from app.schemas.activity import (
    ExerciseCreate,
    ExerciseResponse,
    WorkoutStatsResponse,
)
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/workouts", tags=["Exercise and Workouts"])


@router.post("/", response_model=ExerciseResponse, status_code=status.HTTP_201_CREATED)
def log_workout(
    data_in: ExerciseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    recorded_at = data_in.recorded_at or datetime.datetime.utcnow()
    log = ExerciseLog(
        user_id=current_user.id,
        activity_type=data_in.activity_type.strip(),
        duration_minutes=data_in.duration_minutes,
        calories_burned=data_in.calories_burned,
        intensity=data_in.intensity.strip(),
        notes=data_in.notes,
        recorded_at=recorded_at,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return ExerciseResponse.model_validate(log)


@router.get("/", response_model=list[ExerciseResponse])
def list_workouts(
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    logs = (
        db.query(ExerciseLog)
        .filter(ExerciseLog.user_id == current_user.id)
        .order_by(ExerciseLog.recorded_at.desc())
        .limit(limit)
        .all()
    )
    return [ExerciseResponse.model_validate(log) for log in logs]


@router.delete("/{log_id}", status_code=status.HTTP_200_OK)
def delete_workout(
    log_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    log = db.query(ExerciseLog).filter(ExerciseLog.id == log_id, ExerciseLog.user_id == current_user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Workout log not found or unauthorized.")

    db.delete(log)
    db.commit()
    return {"message": "Workout log deleted successfully."}


@router.get("/stats", response_model=WorkoutStatsResponse)
def get_workout_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    seven_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    recent = (
        db.query(ExerciseLog)
        .filter(ExerciseLog.user_id == current_user.id, ExerciseLog.recorded_at >= seven_days_ago)
        .order_by(ExerciseLog.recorded_at.desc())
        .all()
    )

    total_mins = sum(w.duration_minutes for w in recent)
    total_cals = sum(w.calories_burned for w in recent)

    return WorkoutStatsResponse(
        weekly_active_minutes=total_mins,
        target_active_minutes=150,  # WHO standard recommendation: 150 mins/week
        total_workouts_count=len(recent),
        total_calories_burned=round(total_cals, 1),
        recent_workouts=[ExerciseResponse.model_validate(w) for w in recent[:5]],
    )
