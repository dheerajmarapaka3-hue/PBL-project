import datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User



class Medicine(Base):
    __tablename__ = "medicines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    dosage: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., "500mg"
    form: Mapped[str] = mapped_column(String(50), default="Tablet")  # Tablet, Capsule, Syrup, Drops, Injection
    instructions: Mapped[str] = mapped_column(String(255), default="Take with water")  # Before meal, After meal, etc.
    frequency: Mapped[str] = mapped_column(String(100), default="Daily")  # Daily, Twice daily, As needed
    schedule_times: Mapped[str] = mapped_column(String(255), default="08:00")  # comma-separated "08:00, 20:00"

    start_date: Mapped[str] = mapped_column(String(50), nullable=False)
    end_date: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="medicines")
    doses: Mapped[list["MedicineDose"]] = relationship("MedicineDose", back_populates="medicine", cascade="all, delete-orphan")


class MedicineDose(Base):
    __tablename__ = "medicine_doses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    medicine_id: Mapped[int] = mapped_column(Integer, ForeignKey("medicines.id", ondelete="CASCADE"), index=True, nullable=False)

    scheduled_date: Mapped[str] = mapped_column(String(20), index=True, nullable=False)  # YYYY-MM-DD
    scheduled_time: Mapped[str] = mapped_column(String(10), nullable=False)  # HH:MM
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, taken, skipped
    taken_at: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    medicine: Mapped["Medicine"] = relationship("Medicine", back_populates="doses")
