import datetime
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )

    profile: Mapped["UserProfile"] = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    measurements: Mapped[list["HealthMeasurement"]] = relationship("HealthMeasurement", back_populates="user", cascade="all, delete-orphan")
    documents: Mapped[list["MedicalDocument"]] = relationship("MedicalDocument", back_populates="user", cascade="all, delete-orphan")
    medicines: Mapped[list["Medicine"]] = relationship("Medicine", back_populates="user", cascade="all, delete-orphan")
    food_entries: Mapped[list["FoodEntry"]] = relationship("FoodEntry", back_populates="user", cascade="all, delete-orphan")
    exercises: Mapped[list["ExerciseLog"]] = relationship("ExerciseLog", back_populates="user", cascade="all, delete-orphan")
    meditations: Mapped[list["MeditationLog"]] = relationship("MeditationLog", back_populates="user", cascade="all, delete-orphan")
    routines: Mapped[list["Routine"]] = relationship("Routine", back_populates="user", cascade="all, delete-orphan")
    goals: Mapped[list["HealthGoal"]] = relationship("HealthGoal", back_populates="user", cascade="all, delete-orphan")
    conversations: Mapped[list["Conversation"]] = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    dob: Mapped[str | None] = mapped_column(String(50), nullable=True)
    gender: Mapped[str | None] = mapped_column(String(50), nullable=True)
    height: Mapped[float | None] = mapped_column(Float, nullable=True)  # in cm
    weight: Mapped[float | None] = mapped_column(Float, nullable=True)  # in kg
    blood_group: Mapped[str | None] = mapped_column(String(10), nullable=True)
    unit_preference: Mapped[str] = mapped_column(String(20), default="metric")  # metric / imperial

    activity_level: Mapped[str | None] = mapped_column(String(50), nullable=True)  # sedentary, light, moderate, active
    dietary_preference: Mapped[str | None] = mapped_column(String(100), nullable=True)  # omnivore, vegetarian, vegan, etc.
    allergies: Mapped[str | None] = mapped_column(Text, nullable=True)
    medical_conditions: Mapped[str | None] = mapped_column(Text, nullable=True)
    health_goals: Mapped[str | None] = mapped_column(Text, nullable=True)

    emergency_contact_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Daily targets
    target_water_ml: Mapped[int] = mapped_column(Integer, default=2500)
    target_sleep_hours: Mapped[float] = mapped_column(Float, default=8.0)
    target_steps: Mapped[int] = mapped_column(Integer, default=8000)
    target_calories: Mapped[int] = mapped_column(Integer, default=2000)

    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )

    user: Mapped["User"] = relationship("User", back_populates="profile")
