from app.schemas.auth import (
    UserRegister,
    UserLogin,
    Token,
    UserResponse,
    UserProfileUpdate,
    UserProfileResponse,
)
from app.schemas.measurement import (
    MeasurementCreate,
    MeasurementUpdate,
    MeasurementResponse,
    MeasurementSummary,
)
from app.schemas.document import DocumentResponse, DocumentQuestionRequest
from app.schemas.medicine import (
    MedicineCreate,
    MedicineUpdate,
    MedicineResponse,
    MedicineDoseResponse,
    DoseStatusUpdate,
)
from app.schemas.nutrition import (
    FoodEntryCreate,
    FoodEntryUpdate,
    FoodEntryResponse,
    NutritionSummaryResponse,
)
from app.schemas.activity import (
    ExerciseCreate,
    ExerciseResponse,
    MeditationComplete,
    MeditationResponse,
    WorkoutStatsResponse,
)
from app.schemas.routine import (
    RoutineCreate,
    RoutineUpdate,
    RoutineResponse,
    RoutineSuggestionRequest,
    RoutineSuggestionResponse,
    GoalCreate,
    GoalUpdate,
    GoalResponse,
)
from app.schemas.chat import (
    ConversationCreate,
    ConversationResponse,
    MessageCreate,
    ChatMessageResponse,
    AssistantReplyResponse,
)
from app.schemas.dashboard import DashboardSummaryResponse, VitalityBreakdown

__all__ = [
    "UserRegister",
    "UserLogin",
    "Token",
    "UserResponse",
    "UserProfileUpdate",
    "UserProfileResponse",
    "MeasurementCreate",
    "MeasurementUpdate",
    "MeasurementResponse",
    "MeasurementSummary",
    "DocumentResponse",
    "DocumentQuestionRequest",
    "MedicineCreate",
    "MedicineUpdate",
    "MedicineResponse",
    "MedicineDoseResponse",
    "DoseStatusUpdate",
    "FoodEntryCreate",
    "FoodEntryUpdate",
    "FoodEntryResponse",
    "NutritionSummaryResponse",
    "ExerciseCreate",
    "ExerciseResponse",
    "MeditationComplete",
    "MeditationResponse",
    "WorkoutStatsResponse",
    "RoutineCreate",
    "RoutineUpdate",
    "RoutineResponse",
    "RoutineSuggestionRequest",
    "RoutineSuggestionResponse",
    "GoalCreate",
    "GoalUpdate",
    "GoalResponse",
    "ConversationCreate",
    "ConversationResponse",
    "MessageCreate",
    "ChatMessageResponse",
    "AssistantReplyResponse",
    "DashboardSummaryResponse",
    "VitalityBreakdown",
]
