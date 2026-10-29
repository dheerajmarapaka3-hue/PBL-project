import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, JSON
from app.database import Base


class CatalogExercise(Base):
    __tablename__ = "catalog_exercises"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=True, index=True)
    body_part = Column(String(100), nullable=True, index=True)
    target_muscle = Column(String(100), nullable=True, index=True)
    secondary_muscles = Column(JSON, nullable=True)  # List of strings
    equipment = Column(String(100), nullable=True, index=True)
    difficulty = Column(String(50), nullable=True, index=True)
    force_type = Column(String(50), nullable=True)
    mechanic = Column(String(50), nullable=True)
    is_bodyweight = Column(Boolean, default=False)
    met = Column(Float, default=4.0)

    # Content
    description = Column(Text, nullable=True)
    instructions = Column(JSON, nullable=True)  # List of string steps
    tips = Column(JSON, nullable=True)  # List of tips

    # Media
    image_url = Column(String(500), nullable=True)
    animation_frames = Column(JSON, nullable=True)  # List of relative URLs
    animation_sequence = Column(JSON, nullable=True)  # List of frame indices e.g. [0, 1, 2, 1]
    frame_duration_ms = Column(Integer, default=180)
    has_animation = Column(Boolean, default=False, index=True)
    has_image = Column(Boolean, default=False, index=True)

    # Provenance and Licensing
    source = Column(String(50), nullable=False)  # "RepDB", "Flow", "Both"
    source_id_repdb = Column(String(100), nullable=True)
    source_id_flow = Column(String(50), nullable=True)
    attribution = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
