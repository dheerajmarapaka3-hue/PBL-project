import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserProfile
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    Token,
    UserResponse,
    UserProfileUpdate,
)
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    # Hash password securely
    hashed_pw = hash_password(user_in.password)

    new_user = User(
        email=user_in.email.lower(),
        hashed_password=hashed_pw,
        full_name=user_in.full_name,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create empty initial profile
    profile = UserProfile(
        user_id=new_user.id,
        target_water_ml=2500,
        target_sleep_hours=8.0,
        target_steps=8000,
        target_calories=2000,
        unit_preference="metric",
    )
    db.add(profile)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(data={"sub": str(new_user.id), "email": new_user.email})

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user),
    )


@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password. Please try again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your account is deactivated. Please contact support.",
        )

    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_in: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = current_user.profile
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    for field, value in profile_in.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.delete("/account", status_code=status.HTTP_200_OK)
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Remove any physical document files owned by user
    for doc in current_user.documents:
        if os.path.exists(doc.file_path):
            try:
                os.remove(doc.file_path)
            except Exception:
                pass

    db.delete(current_user)
    db.commit()
    return {"message": "Account and all associated health records deleted successfully."}


@router.get("/export")
def export_my_data(current_user: User = Depends(get_current_user)):
    """Export complete user health data for privacy and portability."""
    p = current_user.profile
    return {
        "export_date": "2026-10-27",
        "user": {
            "email": current_user.email,
            "full_name": current_user.full_name,
            "created_at": str(current_user.created_at),
        },
        "profile": {
            "dob": p.dob if p else None,
            "gender": p.gender if p else None,
            "height": p.height if p else None,
            "weight": p.weight if p else None,
            "blood_group": p.blood_group if p else None,
            "dietary_preference": p.dietary_preference if p else None,
            "allergies": p.allergies if p else None,
            "medical_conditions": p.medical_conditions if p else None,
            "emergency_contact_name": p.emergency_contact_name if p else None,
            "emergency_contact_phone": p.emergency_contact_phone if p else None,
            "target_water_ml": p.target_water_ml if p else 2500,
            "target_sleep_hours": p.target_sleep_hours if p else 8.0,
            "target_steps": p.target_steps if p else 8000,
            "target_calories": p.target_calories if p else 2000,
            "unit_preference": p.unit_preference if p else "metric",
        },
        "vitals_count": len(current_user.measurements),
        "medicines_count": len(current_user.medicines),
        "documents_count": len(current_user.documents),
        "routines_count": len(current_user.routines),
        "goals_count": len(current_user.goals),
        "food_entries_count": len(current_user.food_entries),
        "exercises_count": len(current_user.exercises),
        "meditations_count": len(current_user.meditations),
    }
