import datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User



class Routine(Base):
    __tablename__ = "routines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(50), default="Morning")  # Morning, Afternoon, Evening, Anytime
    target_time: Mapped[str | None] = mapped_column(String(10), nullable=True)  # e.g. "07:30"
    recurrence: Mapped[str] = mapped_column(String(50), default="daily")  # daily, weekdays, weekends
    icon: Mapped[str] = mapped_column(String(50), default="check_circle")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="routines")
    completions: Mapped[list["RoutineCompletion"]] = relationship("RoutineCompletion", back_populates="routine", cascade="all, delete-orphan")


class RoutineCompletion(Base):
    __tablename__ = "routine_completions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    routine_id: Mapped[int] = mapped_column(Integer, ForeignKey("routines.id", ondelete="CASCADE"), index=True, nullable=False)

    completed_date: Mapped[str] = mapped_column(String(20), index=True, nullable=False)  # YYYY-MM-DD
    completed_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    routine: Mapped["Routine"] = relationship("Routine", back_populates="completions")


class HealthGoal(Base):
    __tablename__ = "health_goals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(50), default="activity")  # activity, nutrition, hydration, sleep, mindfulness, vitals
    target_value: Mapped[float] = mapped_column(Float, nullable=False)
    current_value: Mapped[float] = mapped_column(Float, default=0.0)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)  # steps, ml, hours, days, etc.
    deadline: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")  # active, completed, paused

    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="goals")
