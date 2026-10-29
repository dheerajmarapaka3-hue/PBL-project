import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.measurement import HealthMeasurement
from app.schemas.measurement import (
    MeasurementCreate,
    MeasurementUpdate,
    MeasurementResponse,
    MeasurementSummary,
    MeasurementTrendPoint,
)
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/vitals", tags=["Health Tracking"])

NORMAL_RANGES = {
    "blood_pressure": ("< 120/80 mmHg", "Optimal: Systolic < 120 and Diastolic < 80"),
    "heart_rate": ("60 - 100 bpm", "Normal resting heart rate for adults"),
    "weight": ("BMI 18.5 - 24.9", "Healthy body mass range"),
    "blood_glucose": ("70 - 99 mg/dL", "Fasting normal range"),
    "body_temp": ("36.1 - 37.2 °C", "97 - 99 °F normal body temperature"),
    "sleep": ("7.0 - 9.0 hrs", "Recommended nightly adult sleep duration"),
    "water": ("2000 - 3000 ml", "Recommended daily hydration volume"),
    "steps": ("8000 - 10000 steps", "Active lifestyle baseline target"),
}


@router.post("/measurements", response_model=MeasurementResponse, status_code=status.HTTP_201_CREATED)
def create_measurement(
    data_in: MeasurementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    recorded_at = data_in.recorded_at or datetime.datetime.utcnow()
    measurement = HealthMeasurement(
        user_id=current_user.id,
        type=data_in.type.lower().strip(),
        value_primary=data_in.value_primary,
        value_secondary=data_in.value_secondary,
        unit=data_in.unit.strip(),
        notes=data_in.notes,
        recorded_at=recorded_at,
    )
    db.add(measurement)
    db.commit()
    db.refresh(measurement)
    return MeasurementResponse.model_validate(measurement)


@router.get("/measurements", response_model=list[MeasurementResponse])
def list_measurements(
    type: str | None = Query(None, description="Filter by measurement type"),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(HealthMeasurement).filter(HealthMeasurement.user_id == current_user.id)
    if type:
        query = query.filter(HealthMeasurement.type == type.lower().strip())

    measurements = query.order_by(HealthMeasurement.recorded_at.desc()).limit(limit).all()
    return [MeasurementResponse.model_validate(m) for m in measurements]


@router.get("/measurements/{measurement_id}", response_model=MeasurementResponse)
def get_measurement(
    measurement_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    m = (
        db.query(HealthMeasurement)
        .filter(HealthMeasurement.id == measurement_id, HealthMeasurement.user_id == current_user.id)
        .first()
    )
    if not m:
        raise HTTPException(status_code=404, detail="Measurement not found or unauthorized.")
    return MeasurementResponse.model_validate(m)


@router.put("/measurements/{measurement_id}", response_model=MeasurementResponse)
def update_measurement(
    measurement_id: int,
    data_in: MeasurementUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    m = (
        db.query(HealthMeasurement)
        .filter(HealthMeasurement.id == measurement_id, HealthMeasurement.user_id == current_user.id)
        .first()
    )
    if not m:
        raise HTTPException(status_code=404, detail="Measurement not found or unauthorized.")

    for field, val in data_in.model_dump(exclude_unset=True).items():
        setattr(m, field, val)

    db.commit()
    db.refresh(m)
    return MeasurementResponse.model_validate(m)


@router.delete("/measurements/{measurement_id}", status_code=status.HTTP_200_OK)
def delete_measurement(
    measurement_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    m = (
        db.query(HealthMeasurement)
        .filter(HealthMeasurement.id == measurement_id, HealthMeasurement.user_id == current_user.id)
        .first()
    )
    if not m:
        raise HTTPException(status_code=404, detail="Measurement not found or unauthorized.")

    db.delete(m)
    db.commit()
    return {"message": "Measurement deleted successfully."}


@router.get("/analytics", response_model=list[MeasurementSummary])
def get_analytics(
    days: int = Query(30, ge=7, le=90),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    since_date = datetime.datetime.utcnow() - datetime.timedelta(days=days)
    records = (
        db.query(HealthMeasurement)
        .filter(
            HealthMeasurement.user_id == current_user.id,
            HealthMeasurement.recorded_at >= since_date,
        )
        .order_by(HealthMeasurement.recorded_at.asc())
        .all()
    )

    # Group by measurement type
    by_type: dict[str, list[HealthMeasurement]] = {}
    for r in records:
        by_type.setdefault(r.type, []).append(r)

    standard_types = [
        ("blood_pressure", "mmHg"),
        ("heart_rate", "bpm"),
        ("sleep", "hours"),
        ("water", "ml"),
        ("weight", "kg"),
        ("blood_glucose", "mg/dL"),
        ("steps", "steps"),
        ("body_temp", "°C"),
    ]

    summaries = []
    for m_type, default_unit in standard_types:
        type_records = by_type.get(m_type, [])
        normal_range_str = NORMAL_RANGES.get(m_type, ("N/A", "Standard"))[0]

        if not type_records:
            summaries.append(
                MeasurementSummary(
                    type=m_type,
                    unit=default_unit,
                    latest_value_primary=None,
                    latest_value_secondary=None,
                    latest_date=None,
                    average=None,
                    min=None,
                    max=None,
                    normal_range=normal_range_str,
                    status="No Data",
                    history=[],
                )
            )
            continue

        latest = type_records[-1]
        values = [r.value_primary for r in type_records]
        avg_val = round(sum(values) / len(values), 1)
        min_val = min(values)
        max_val = max(values)

        # Status heuristic
        status_label = "Optimal"
        if m_type == "blood_pressure":
            if latest.value_primary >= 130 or (latest.value_secondary or 80) >= 80:
                status_label = "Elevated"
            else:
                status_label = "Normal"
        elif m_type == "heart_rate":
            if latest.value_primary > 100:
                status_label = "High"
            elif latest.value_primary < 60:
                status_label = "Low"
            else:
                status_label = "Normal"
        elif m_type == "sleep":
            if latest.value_primary < 6.0:
                status_label = "Below Target"
            else:
                status_label = "Restorative"

        history_points = [
            MeasurementTrendPoint(
                date=r.recorded_at.strftime("%b %d"),
                value_primary=r.value_primary,
                value_secondary=r.value_secondary,
            )
            for r in type_records
        ]

        summaries.append(
            MeasurementSummary(
                type=m_type,
                unit=latest.unit or default_unit,
                latest_value_primary=latest.value_primary,
                latest_value_secondary=latest.value_secondary,
                latest_date=latest.recorded_at.strftime("%Y-%m-%d"),
                average=avg_val,
                min=min_val,
                max=max_val,
                normal_range=normal_range_str,
                status=status_label,
                history=history_points,
            )
        )

    return summaries
