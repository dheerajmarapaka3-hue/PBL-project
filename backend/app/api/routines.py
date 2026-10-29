import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.routine import Routine, RoutineCompletion
from app.schemas.routine import (
    RoutineCreate,
    RoutineUpdate,
    RoutineResponse,
    RoutineSuggestionRequest,
    RoutineSuggestionResponse,
    ProposedRoutineItem,
)
from app.services.auth_service import get_current_user
from app.services.ai_service import suggest_routines_from_goal

router = APIRouter(prefix="/routines", tags=["Daily Routines and Goals"])


@router.post("/", response_model=RoutineResponse, status_code=status.HTTP_201_CREATED)
def create_routine(
    data_in: RoutineCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    routine = Routine(
        user_id=current_user.id,
        title=data_in.title.strip(),
        category=data_in.category.strip(),
        target_time=data_in.target_time.strip() if data_in.target_time else None,
        recurrence=data_in.recurrence.strip(),
        icon=data_in.icon.strip(),
        is_active=True,
    )
    db.add(routine)
    db.commit()
    db.refresh(routine)

    return RoutineResponse(
        id=routine.id,
        user_id=routine.user_id,
        title=routine.title,
        category=routine.category,
        target_time=routine.target_time,
        recurrence=routine.recurrence,
        icon=routine.icon,
        is_active=routine.is_active,
        completed_today=False,
        streak_days=0,
        created_at=routine.created_at,
    )


@router.get("/", response_model=list[RoutineResponse])
def list_routines(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today_str = datetime.date.today().isoformat()
    routines = (
        db.query(Routine)
        .filter(Routine.user_id == current_user.id)
        .order_by(Routine.target_time.asc().nullslast(), Routine.id.asc())
        .all()
    )

    completions = (
        db.query(RoutineCompletion)
        .filter(RoutineCompletion.user_id == current_user.id)
        .all()
    )
    # Map of routine_id to set of dates
    comp_map: dict[int, set[str]] = {}
    for c in completions:
        comp_map.setdefault(c.routine_id, set()).add(c.completed_date)

    results = []
    for r in routines:
        dates_set = comp_map.get(r.id, set())
        is_completed_today = today_str in dates_set

        # Calculate streak
        streak = 0
        check_date = datetime.date.today()
        # If not completed today, streak might still be intact from yesterday
        if check_date.isoformat() not in dates_set:
            check_date -= datetime.timedelta(days=1)
        while check_date.isoformat() in dates_set:
            streak += 1
            check_date -= datetime.timedelta(days=1)

        results.append(
            RoutineResponse(
                id=r.id,
                user_id=r.user_id,
                title=r.title,
                category=r.category,
                target_time=r.target_time,
                recurrence=r.recurrence,
                icon=r.icon,
                is_active=r.is_active,
                completed_today=is_completed_today,
                streak_days=streak,
                created_at=r.created_at,
            )
        )
    return results


@router.put("/{routine_id}", response_model=RoutineResponse)
def update_routine(
    routine_id: int,
    data_in: RoutineUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    routine = db.query(Routine).filter(Routine.id == routine_id, Routine.user_id == current_user.id).first()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found or unauthorized.")

    for field, val in data_in.model_dump(exclude_unset=True).items():
        setattr(routine, field, val)

    db.commit()
    db.refresh(routine)

    today_str = datetime.date.today().isoformat()
    is_completed = (
        db.query(RoutineCompletion)
        .filter(
            RoutineCompletion.user_id == current_user.id,
            RoutineCompletion.routine_id == routine.id,
            RoutineCompletion.completed_date == today_str,
        )
        .first()
        is not None
    )

    return RoutineResponse(
        id=routine.id,
        user_id=routine.user_id,
        title=routine.title,
        category=routine.category,
        target_time=routine.target_time,
        recurrence=routine.recurrence,
        icon=routine.icon,
        is_active=routine.is_active,
        completed_today=is_completed,
        streak_days=1 if is_completed else 0,
        created_at=routine.created_at,
    )


@router.delete("/{routine_id}", status_code=status.HTTP_200_OK)
def delete_routine(
    routine_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    routine = db.query(Routine).filter(Routine.id == routine_id, Routine.user_id == current_user.id).first()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found or unauthorized.")

    db.delete(routine)
    db.commit()
    return {"message": "Routine deleted successfully."}


@router.post("/{routine_id}/toggle", response_model=RoutineResponse)
def toggle_routine_today(
    routine_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    routine = db.query(Routine).filter(Routine.id == routine_id, Routine.user_id == current_user.id).first()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found or unauthorized.")

    today_str = datetime.date.today().isoformat()
    completion = (
        db.query(RoutineCompletion)
        .filter(
            RoutineCompletion.user_id == current_user.id,
            RoutineCompletion.routine_id == routine.id,
            RoutineCompletion.completed_date == today_str,
        )
        .first()
    )

    if completion:
        db.delete(completion)
        db.commit()
        is_completed = False
    else:
        new_comp = RoutineCompletion(
            user_id=current_user.id,
            routine_id=routine.id,
            completed_date=today_str,
            completed_at=datetime.datetime.utcnow(),
        )
        db.add(new_comp)
        db.commit()
        is_completed = True

    return RoutineResponse(
        id=routine.id,
        user_id=routine.user_id,
        title=routine.title,
        category=routine.category,
        target_time=routine.target_time,
        recurrence=routine.recurrence,
        icon=routine.icon,
        is_active=routine.is_active,
        completed_today=is_completed,
        streak_days=1 if is_completed else 0,
        created_at=routine.created_at,
    )


@router.post("/ai-suggest", response_model=RoutineSuggestionResponse)
def ai_suggest_routines(
    request: RoutineSuggestionRequest,
    current_user: User = Depends(get_current_user),
):
    proposals = suggest_routines_from_goal(request.goal_prompt)
    items = [
        ProposedRoutineItem(
            title=p["title"],
            category=p["category"],
            target_time=p["target_time"],
            recurrence=p["recurrence"],
            icon=p["icon"],
            reason=p["reason"],
        )
        for p in proposals
    ]

    return RoutineSuggestionResponse(
        plan_title=f"Personalized Wellness Plan for '{request.goal_prompt}'",
        plan_description=(
            "Review your AI-suggested habit plan below. You can customize or select which routines to save to your daily schedule."
        ),
        proposed_routines=items,
    )
