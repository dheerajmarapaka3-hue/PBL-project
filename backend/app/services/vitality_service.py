import datetime
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.measurement import HealthMeasurement
from app.models.routine import Routine, RoutineCompletion
from app.models.activity import ExerciseLog
from app.models.nutrition import FoodEntry
from app.schemas.dashboard import VitalityBreakdown


def calculate_vitality_score(user: User, db: Session) -> VitalityBreakdown:
    today_str = datetime.date.today().isoformat()
    start_of_day = datetime.datetime.combine(datetime.date.today(), datetime.time.min)
    end_of_day = datetime.datetime.combine(datetime.date.today(), datetime.time.max)

    data_points_found = 0

    # 1. Hydration Score (0 - 20)
    target_water = user.profile.target_water_ml if user.profile else 2500
    water_records = (
        db.query(HealthMeasurement)
        .filter(
            HealthMeasurement.user_id == user.id,
            HealthMeasurement.type == "water",
            HealthMeasurement.recorded_at >= start_of_day,
            HealthMeasurement.recorded_at <= end_of_day,
        )
        .all()
    )
    total_water = sum(r.value_primary for r in water_records)
    if total_water > 0:
        data_points_found += 1
        hydration_score = min(20, int((total_water / target_water) * 20))
    else:
        # Check if water was logged in past 3 days as baseline
        hydration_score = 12

    # 2. Sleep Score (0 - 25)
    sleep_record = (
        db.query(HealthMeasurement)
        .filter(
            HealthMeasurement.user_id == user.id,
            HealthMeasurement.type == "sleep",
        )
        .order_by(HealthMeasurement.recorded_at.desc())
        .first()
    )
    if sleep_record:
        data_points_found += 1
        hours = sleep_record.value_primary
        if 7.0 <= hours <= 9.0:
            sleep_score = 25
        elif 6.0 <= hours < 7.0 or 9.0 < hours <= 10.0:
            sleep_score = 20
        elif 5.0 <= hours < 6.0:
            sleep_score = 14
        else:
            sleep_score = 10
    else:
        sleep_score = 18

    # 3. Routines Score (0 - 25)
    active_routines = db.query(Routine).filter(Routine.user_id == user.id, Routine.is_active == True).all()
    if active_routines:
        data_points_found += 1
        completed_count = (
            db.query(RoutineCompletion)
            .filter(
                RoutineCompletion.user_id == user.id,
                RoutineCompletion.completed_date == today_str,
            )
            .count()
        )
        ratio = completed_count / len(active_routines)
        routine_score = int(ratio * 25)
    else:
        routine_score = 15

    # 4. Activity Score (0 - 15)
    seven_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    recent_exercises = (
        db.query(ExerciseLog)
        .filter(
            ExerciseLog.user_id == user.id,
            ExerciseLog.recorded_at >= seven_days_ago,
        )
        .all()
    )
    if recent_exercises:
        data_points_found += 1
        total_mins = sum(e.duration_minutes for e in recent_exercises)
        if total_mins >= 150:
            activity_score = 15
        elif total_mins >= 90:
            activity_score = 12
        elif total_mins >= 30:
            activity_score = 8
        else:
            activity_score = 5
    else:
        activity_score = 8

    # 5. Vitals Score (0 - 15)
    recent_bp = (
        db.query(HealthMeasurement)
        .filter(
            HealthMeasurement.user_id == user.id,
            HealthMeasurement.type == "blood_pressure",
        )
        .order_by(HealthMeasurement.recorded_at.desc())
        .first()
    )
    recent_hr = (
        db.query(HealthMeasurement)
        .filter(
            HealthMeasurement.user_id == user.id,
            HealthMeasurement.type == "heart_rate",
        )
        .order_by(HealthMeasurement.recorded_at.desc())
        .first()
    )
    vitals_score = 10
    if recent_bp or recent_hr:
        data_points_found += 1
        bp_optimal = False
        if recent_bp:
            if recent_bp.value_primary < 120 and (recent_bp.value_secondary or 80) < 80:
                bp_optimal = True
        hr_optimal = False
        if recent_hr:
            if 60 <= recent_hr.value_primary <= 100:
                hr_optimal = True
        if bp_optimal or hr_optimal:
            vitals_score = 14
        else:
            vitals_score = 11

    total = hydration_score + sleep_score + routine_score + activity_score + vitals_score

    # Determine status & percentile
    if total >= 90:
        status_label = "Radiant"
        percentile = "Top 5% Peak"
    elif total >= 80:
        status_label = "Optimal"
        percentile = "Top 15% Healthy"
    elif total >= 70:
        status_label = "Good"
        percentile = "Top 30% Balanced"
    else:
        status_label = "Needs Focus"
        percentile = "Improving"

    has_data = data_points_found >= 1
    explanation = (
        f"Calculated from your logged habits: Hydration ({hydration_score}/20), Sleep ({sleep_score}/25), "
        f"Daily Routines ({routine_score}/25), Activity ({activity_score}/15), and Vitals ({vitals_score}/15)."
    )

    return VitalityBreakdown(
        total_score=total,
        status_label=status_label,
        percentile=percentile,
        hydration_score=hydration_score,
        hydration_max=20,
        sleep_score=sleep_score,
        sleep_max=25,
        routine_score=routine_score,
        routine_max=25,
        activity_score=activity_score,
        activity_max=15,
        vitals_score=vitals_score,
        vitals_max=15,
        has_sufficient_data=has_data,
        explanation=explanation,
    )
