import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.medicine import Medicine, MedicineDose
from app.schemas.medicine import (
    MedicineCreate,
    MedicineUpdate,
    MedicineResponse,
    MedicineDoseResponse,
    DoseStatusUpdate,
)
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/medicines", tags=["Medicines and Reminders"])


@router.post("/", response_model=MedicineResponse, status_code=status.HTTP_201_CREATED)
def create_medicine(
    med_in: MedicineCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    med = Medicine(
        user_id=current_user.id,
        name=med_in.name.strip(),
        dosage=med_in.dosage.strip(),
        form=med_in.form.strip(),
        instructions=med_in.instructions.strip(),
        frequency=med_in.frequency.strip(),
        schedule_times=med_in.schedule_times.strip(),
        start_date=med_in.start_date.strip(),
        end_date=med_in.end_date.strip() if med_in.end_date else None,
        notes=med_in.notes,
        is_active=True,
    )
    db.add(med)
    db.commit()
    db.refresh(med)

    # Automatically generate today's doses for this medicine
    today_str = datetime.date.today().isoformat()
    times = [t.strip() for t in med.schedule_times.split(",") if t.strip()]
    for t in times:
        dose = MedicineDose(
            user_id=current_user.id,
            medicine_id=med.id,
            scheduled_date=today_str,
            scheduled_time=t,
            status="pending",
        )
        db.add(dose)
    db.commit()

    return MedicineResponse.model_validate(med)


@router.get("/", response_model=list[MedicineResponse])
def list_medicines(
    active_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Medicine).filter(Medicine.user_id == current_user.id)
    if active_only:
        query = query.filter(Medicine.is_active == True)
    meds = query.order_by(Medicine.name.asc()).all()
    return [MedicineResponse.model_validate(m) for m in meds]


@router.put("/{medicine_id}", response_model=MedicineResponse)
def update_medicine(
    medicine_id: int,
    med_in: MedicineUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    med = db.query(Medicine).filter(Medicine.id == medicine_id, Medicine.user_id == current_user.id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine record not found or unauthorized.")

    for field, val in med_in.model_dump(exclude_unset=True).items():
        setattr(med, field, val)

    db.commit()
    db.refresh(med)
    return MedicineResponse.model_validate(med)


@router.delete("/{medicine_id}", status_code=status.HTTP_200_OK)
def delete_medicine(
    medicine_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    med = db.query(Medicine).filter(Medicine.id == medicine_id, Medicine.user_id == current_user.id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine record not found or unauthorized.")

    db.delete(med)
    db.commit()
    return {"message": "Medicine and all scheduled doses removed successfully."}


@router.get("/today-doses", response_model=list[MedicineDoseResponse])
def get_today_doses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today_str = datetime.date.today().isoformat()

    # Ensure doses exist for all active medicines today
    active_meds = db.query(Medicine).filter(Medicine.user_id == current_user.id, Medicine.is_active == True).all()
    for med in active_meds:
        times = [t.strip() for t in med.schedule_times.split(",") if t.strip()]
        for t in times:
            existing = (
                db.query(MedicineDose)
                .filter(
                    MedicineDose.user_id == current_user.id,
                    MedicineDose.medicine_id == med.id,
                    MedicineDose.scheduled_date == today_str,
                    MedicineDose.scheduled_time == t,
                )
                .first()
            )
            if not existing:
                new_dose = MedicineDose(
                    user_id=current_user.id,
                    medicine_id=med.id,
                    scheduled_date=today_str,
                    scheduled_time=t,
                    status="pending",
                )
                db.add(new_dose)
    db.commit()

    doses = (
        db.query(MedicineDose)
        .filter(MedicineDose.user_id == current_user.id, MedicineDose.scheduled_date == today_str)
        .order_by(MedicineDose.scheduled_time.asc())
        .all()
    )

    results = []
    for d in doses:
        results.append(
            MedicineDoseResponse(
                id=d.id,
                medicine_id=d.medicine_id,
                medicine_name=d.medicine.name,
                dosage=d.medicine.dosage,
                form=d.medicine.form,
                instructions=d.medicine.instructions,
                scheduled_date=d.scheduled_date,
                scheduled_time=d.scheduled_time,
                status=d.status,
                taken_at=d.taken_at,
                notes=d.notes,
            )
        )
    return results


@router.post("/doses/{dose_id}/status", response_model=MedicineDoseResponse)
def update_dose_status(
    dose_id: int,
    status_in: DoseStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dose = db.query(MedicineDose).filter(MedicineDose.id == dose_id, MedicineDose.user_id == current_user.id).first()
    if not dose:
        raise HTTPException(status_code=404, detail="Dose record not found or unauthorized.")

    dose.status = status_in.status.lower()
    if dose.status == "taken":
        dose.taken_at = datetime.datetime.utcnow()
    else:
        dose.taken_at = None

    if status_in.notes:
        dose.notes = status_in.notes

    db.commit()
    db.refresh(dose)

    return MedicineDoseResponse(
        id=dose.id,
        medicine_id=dose.medicine_id,
        medicine_name=dose.medicine.name,
        dosage=dose.medicine.dosage,
        form=dose.medicine.form,
        instructions=dose.medicine.instructions,
        scheduled_date=dose.scheduled_date,
        scheduled_time=dose.scheduled_time,
        status=dose.status,
        taken_at=dose.taken_at,
        notes=dose.notes,
    )
