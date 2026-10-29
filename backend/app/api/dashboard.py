import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.document import MedicalDocument
from app.models.activity import ExerciseLog
from app.schemas.dashboard import DashboardSummaryResponse
from app.schemas.document import DocumentResponse
from app.services.auth_service import get_current_user
from app.services.vitality_service import calculate_vitality_score
from app.api.vitals import get_analytics
from app.api.medicines import get_today_doses
from app.api.routines import list_routines
from app.api.nutrition import get_daily_summary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.datetime.now()
    hour = now.hour
    if hour < 12:
        greeting_time = "Good morning"
    elif hour < 17:
        greeting_time = "Good afternoon"
    else:
        greeting_time = "Good evening"

    first_name = current_user.full_name.split()[0] if current_user.full_name else "there"
    greeting = f"{greeting_time}, {first_name}"
    today_date = now.strftime("%a, %b %d")

    # 1. Vitality Score
    vitality = calculate_vitality_score(current_user, db)

    # 2. Vitals Summary
    vitals_summary = get_analytics(days=30, current_user=current_user, db=db)

    # 3. Today's Medicine Doses
    today_doses = get_today_doses(current_user=current_user, db=db)

    # 4. Today's Routines
    today_routines = list_routines(current_user=current_user, db=db)

    # 5. Nutrition Summary
    nutrition_obj = get_daily_summary(date=now.strftime("%Y-%m-%d"), current_user=current_user, db=db)
    nutrition_summary = {
        "calories": nutrition_obj.total_calories,
        "target_calories": nutrition_obj.target_calories,
        "protein_g": nutrition_obj.total_protein_g,
        "carbs_g": nutrition_obj.total_carbs_g,
        "fat_g": nutrition_obj.total_fat_g,
        "water_ml": nutrition_obj.water_intake_ml,
        "target_water_ml": nutrition_obj.target_water_ml,
    }

    # 6. Recent Medical Documents (last 3)
    recent_docs = (
        db.query(MedicalDocument)
        .filter(MedicalDocument.user_id == current_user.id)
        .order_by(MedicalDocument.created_at.desc())
        .limit(3)
        .all()
    )
    docs_response = [DocumentResponse.model_validate(d) for d in recent_docs]

    # 7. Weekly active workout minutes
    seven_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    recent_exercises = (
        db.query(ExerciseLog)
        .filter(ExerciseLog.user_id == current_user.id, ExerciseLog.recorded_at >= seven_days_ago)
        .all()
    )
    weekly_mins = sum(e.duration_minutes for e in recent_exercises)

    # 8. AI Proactive Insight
    proactive_insight = {
        "tag": "AI MATE • PROACTIVE INSIGHT",
        "timestamp": "Just now",
        "message": (
            f"Hey {first_name}! Your vitality score is {vitality.total_score}/100 today ({vitality.status_label}). "
            f"You have {len([r for r in today_routines if not r.completed_today])} habits pending and "
            f"{len([d for d in today_doses if d.status == 'pending'])} doses remaining today."
        ),
        "action_label": "Chat with AI Mate",
    }

    return DashboardSummaryResponse(
        user_name=current_user.full_name,
        greeting=greeting,
        today_date=today_date,
        vitality=vitality,
        proactive_insight=proactive_insight,
        vitals_summary=vitals_summary,
        today_doses=today_doses,
        today_routines=today_routines,
        nutrition_summary=nutrition_summary,
        recent_documents=docs_response,
        weekly_active_minutes=weekly_mins,
    )
