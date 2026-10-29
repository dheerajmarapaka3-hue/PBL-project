import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.exercise import CatalogExercise
from app.schemas.exercise import (
    CatalogExerciseSummary,
    CatalogExerciseDetail,
    ExerciseListResponse,
    ExerciseFilterOptions,
)

router = APIRouter(prefix="/exercises", tags=["Exercise Catalog"])


@router.get("/", response_model=ExerciseListResponse)
def list_exercises(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(24, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search term for name or muscle"),
    category: Optional[str] = Query(None, description="Filter by category"),
    body_part: Optional[str] = Query(None, description="Filter by body part"),
    target_muscle: Optional[str] = Query(None, description="Filter by target muscle"),
    equipment: Optional[str] = Query(None, description="Filter by equipment"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    has_animation: Optional[bool] = Query(None, description="Filter for animated exercises"),
    has_image: Optional[bool] = Query(None, description="Filter for illustrated exercises"),
    db: Session = Depends(get_db),
):
    query = db.query(CatalogExercise)

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(CatalogExercise.name).like(term),
                func.lower(CatalogExercise.target_muscle).like(term),
                func.lower(CatalogExercise.equipment).like(term),
                func.lower(CatalogExercise.body_part).like(term),
            )
        )

    if category and category.strip():
        query = query.filter(func.lower(CatalogExercise.category) == category.strip().lower())

    if body_part and body_part.strip():
        query = query.filter(func.lower(CatalogExercise.body_part) == body_part.strip().lower())

    if target_muscle and target_muscle.strip():
        query = query.filter(func.lower(CatalogExercise.target_muscle) == target_muscle.strip().lower())

    if equipment and equipment.strip():
        query = query.filter(func.lower(CatalogExercise.equipment) == equipment.strip().lower())

    if difficulty and difficulty.strip():
        query = query.filter(func.lower(CatalogExercise.difficulty) == difficulty.strip().lower())

    if has_animation is not None:
        query = query.filter(CatalogExercise.has_animation == has_animation)

    if has_image is not None:
        query = query.filter(CatalogExercise.has_image == has_image)

    total = query.count()
    pages = math.ceil(total / limit) if total > 0 else 1
    offset = (page - 1) * limit

    items = query.order_by(CatalogExercise.name.asc()).offset(offset).limit(limit).all()

    return ExerciseListResponse(
        items=[CatalogExerciseSummary.model_validate(ex) for ex in items],
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.get("/filters", response_model=ExerciseFilterOptions)
def get_exercise_filters(db: Session = Depends(get_db)):
    categories = [
        c[0] for c in db.query(CatalogExercise.category)
        .distinct()
        .filter(CatalogExercise.category.isnot(None))
        .order_by(CatalogExercise.category.asc())
        .all()
    ]
    body_parts = [
        bp[0] for bp in db.query(CatalogExercise.body_part)
        .distinct()
        .filter(CatalogExercise.body_part.isnot(None))
        .order_by(CatalogExercise.body_part.asc())
        .all()
    ]
    equipment = [
        eq[0] for eq in db.query(CatalogExercise.equipment)
        .distinct()
        .filter(CatalogExercise.equipment.isnot(None))
        .order_by(CatalogExercise.equipment.asc())
        .all()
    ]
    difficulties = [
        d[0] for d in db.query(CatalogExercise.difficulty)
        .distinct()
        .filter(CatalogExercise.difficulty.isnot(None))
        .order_by(CatalogExercise.difficulty.asc())
        .all()
    ]
    target_muscles = [
        tm[0] for tm in db.query(CatalogExercise.target_muscle)
        .distinct()
        .filter(CatalogExercise.target_muscle.isnot(None))
        .order_by(CatalogExercise.target_muscle.asc())
        .limit(30)
        .all()
    ]

    return ExerciseFilterOptions(
        categories=[c for c in categories if c],
        body_parts=[bp for bp in body_parts if bp],
        target_muscles=[tm for tm in target_muscles if tm],
        equipment=[eq for eq in equipment if eq],
        difficulties=[d for d in difficulties if d],
    )


@router.get("/{exercise_id}", response_model=CatalogExerciseDetail)
def get_exercise_detail(exercise_id: str, db: Session = Depends(get_db)):
    exercise = db.query(CatalogExercise).filter(CatalogExercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exercise with id '{exercise_id}' not found in catalogue.",
        )
    return CatalogExerciseDetail.model_validate(exercise)
