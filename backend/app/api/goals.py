from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.routine import HealthGoal
from app.schemas.routine import GoalCreate, GoalUpdate, GoalResponse
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/goals", tags=["Health Goals"])


@router.post("/", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    data_in: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = HealthGoal(
        user_id=current_user.id,
        title=data_in.title.strip(),
        category=data_in.category.strip(),
        target_value=data_in.target_value,
        current_value=data_in.current_value,
        unit=data_in.unit.strip(),
        deadline=data_in.deadline.strip() if data_in.deadline else None,
        status="active",
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return GoalResponse.model_validate(goal)


@router.get("/", response_model=list[GoalResponse])
def list_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goals = db.query(HealthGoal).filter(HealthGoal.user_id == current_user.id).all()
    return [GoalResponse.model_validate(g) for g in goals]


@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: int,
    data_in: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.query(HealthGoal).filter(HealthGoal.id == goal_id, HealthGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Health goal not found or unauthorized.")

    for field, val in data_in.model_dump(exclude_unset=True).items():
        setattr(goal, field, val)

    db.commit()
    db.refresh(goal)
    return GoalResponse.model_validate(goal)


@router.delete("/{goal_id}", status_code=status.HTTP_200_OK)
def delete_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.query(HealthGoal).filter(HealthGoal.id == goal_id, HealthGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Health goal not found or unauthorized.")

    db.delete(goal)
    db.commit()
    return {"message": "Goal removed successfully."}
