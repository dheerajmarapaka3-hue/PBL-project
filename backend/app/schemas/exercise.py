from typing import Optional
from pydantic import BaseModel, ConfigDict


class CatalogExerciseSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    category: Optional[str] = None
    body_part: Optional[str] = None
    target_muscle: Optional[str] = None
    equipment: Optional[str] = None
    difficulty: Optional[str] = None
    met: float = 4.0
    image_url: Optional[str] = None
    has_animation: bool = False
    has_image: bool = False
    source: str


class CatalogExerciseDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    category: Optional[str] = None
    body_part: Optional[str] = None
    target_muscle: Optional[str] = None
    secondary_muscles: Optional[list[str]] = None
    equipment: Optional[str] = None
    difficulty: Optional[str] = None
    force_type: Optional[str] = None
    mechanic: Optional[str] = None
    is_bodyweight: bool = False
    met: float = 4.0
    description: Optional[str] = None
    instructions: Optional[list[str]] = None
    tips: Optional[list[str]] = None
    image_url: Optional[str] = None
    animation_frames: Optional[list[str]] = None
    animation_sequence: Optional[list[int]] = None
    frame_duration_ms: int = 180
    has_animation: bool = False
    has_image: bool = False
    source: str
    source_id_repdb: Optional[str] = None
    source_id_flow: Optional[str] = None
    attribution: str


class ExerciseListResponse(BaseModel):
    items: list[CatalogExerciseSummary]
    total: int
    page: int
    limit: int
    pages: int


class ExerciseFilterOptions(BaseModel):
    categories: list[str]
    body_parts: list[str]
    target_muscles: list[str]
    equipment: list[str]
    difficulties: list[str]
