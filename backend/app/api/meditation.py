import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.activity import MeditationLog
from app.schemas.activity import MeditationComplete, MeditationResponse
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/meditation", tags=["Meditation and Yoga"])

CATALOG_SESSIONS = [
    {
        "id": "box-breathing",
        "title": "Box Breathing (4-4-4-4)",
        "category": "Breathing",
        "duration_minutes": 4,
        "description": "Navy SEAL technique to rapidly reset the autonomic nervous system: Inhale 4s, Hold 4s, Exhale 4s, Hold empty 4s.",
        "icon": "crop_free",
        "guidance": "Sit upright with shoulders relaxed. Follow the rhythmic visual guide to breathe evenly and anchor focus.",
    },
    {
        "id": "deep-478",
        "title": "4-7-8 Deep Sleep Breathing",
        "category": "Sleep & Calming",
        "duration_minutes": 5,
        "description": "Dr. Andrew Weil's natural tranquilizer for the nervous system: Inhale 4s, Hold 7s, Exhale 8s.",
        "icon": "bedtime",
        "guidance": "Rest your tongue lightly against the ridge behind your upper front teeth. Exhale completely through your mouth with a soft whoosh sound.",
    },
    {
        "id": "morning-sun-salutation",
        "title": "Sun Salutation (Surya Namaskar)",
        "category": "Yoga Flow",
        "duration_minutes": 10,
        "description": "A graceful flow of 12 linked postures synchronized with breath to awaken spine flexibility and morning vigor.",
        "icon": "wb_sunny",
        "guidance": "Begin in Mountain Pose (Tadasana). Flow with smooth breaths through Forward Fold, Plank, Cobra, and Downward Dog.",
    },
    {
        "id": "body-scan-relaxation",
        "title": "Mindful Body Scan",
        "category": "Mindfulness",
        "duration_minutes": 8,
        "description": "Cultivate somatic awareness and release subconscious muscular tension from head to toes.",
        "icon": "accessibility_new",
        "guidance": "Lie down comfortably on your back or sit supported. Progressively sweep your gentle attention from your toes upward.",
    },
    {
        "id": "gentle-restorative-yoga",
        "title": "Gentle Restorative Stretch",
        "category": "Restorative Yoga",
        "duration_minutes": 12,
        "description": "Calming, passive yoga postures designed to open hips, hamstrings, and thoracic spine without strain.",
        "icon": "spa",
        "guidance": "Hold each pose for 1–2 minutes using pillows or cushions for supportive comfort. Never push into sharp pain.",
    },
]


@router.get("/sessions")
def get_catalog_sessions():
    return CATALOG_SESSIONS


@router.post("/complete", response_model=MeditationResponse, status_code=status.HTTP_201_CREATED)
def complete_session(
    data_in: MeditationComplete,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    log = MeditationLog(
        user_id=current_user.id,
        session_name=data_in.session_name.strip(),
        session_type=data_in.session_type.strip(),
        duration_minutes=data_in.duration_minutes,
        notes=data_in.notes,
        completed_at=datetime.datetime.utcnow(),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return MeditationResponse.model_validate(log)


@router.get("/history", response_model=list[MeditationResponse])
def get_meditation_history(
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    logs = (
        db.query(MeditationLog)
        .filter(MeditationLog.user_id == current_user.id)
        .order_by(MeditationLog.completed_at.desc())
        .limit(limit)
        .all()
    )
    return [MeditationResponse.model_validate(l) for l in logs]
