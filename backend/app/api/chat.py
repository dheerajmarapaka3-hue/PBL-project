import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.chat import Conversation, ChatMessage
from app.models.measurement import HealthMeasurement
from app.schemas.chat import (
    ConversationCreate,
    ConversationResponse,
    MessageCreate,
    ChatMessageResponse,
    AssistantReplyResponse,
)
from app.services.auth_service import get_current_user
from app.services.ai_service import query_llm, detect_emergency

router = APIRouter(prefix="/chat", tags=["AI Health Assistant"])


@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    data_in: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    title = data_in.title.strip() if data_in.title else "Health & Wellness Chat"
    convo = Conversation(user_id=current_user.id, title=title)
    db.add(convo)
    db.commit()
    db.refresh(convo)

    # Add initial friendly assistant welcome message
    welcome_msg = ChatMessage(
        conversation_id=convo.id,
        user_id=current_user.id,
        role="assistant",
        content=(
            f"Hello {current_user.full_name.split()[0]}! 🌿 I'm **AI Mate**, your personal wellness companion. "
            "How can I help you today? You can ask me about your recent vitals, healthy routines, nutrition, "
            "exercise modifications, or questions to prepare for your doctor visit."
        ),
    )
    db.add(welcome_msg)
    db.commit()
    db.refresh(convo)

    return ConversationResponse.model_validate(convo)


@router.get("/conversations", response_model=list[ConversationResponse])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    convos = (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    return [ConversationResponse.model_validate(c) for c in convos]


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    convo = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .first()
    )
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found or unauthorized.")
    return ConversationResponse.model_validate(convo)


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_200_OK)
def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    convo = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .first()
    )
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found or unauthorized.")

    db.delete(convo)
    db.commit()
    return {"message": "Conversation deleted successfully."}


@router.post("/conversations/{conversation_id}/messages", response_model=AssistantReplyResponse)
async def send_message(
    conversation_id: int,
    data_in: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    convo = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .first()
    )
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found or unauthorized.")

    user_text = data_in.content.strip()
    if not user_text:
        raise HTTPException(status_code=400, detail="Message content cannot be blank.")

    # Save user message
    user_msg = ChatMessage(
        conversation_id=convo.id,
        user_id=current_user.id,
        role="user",
        content=user_text,
    )
    db.add(user_msg)
    convo.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(user_msg)

    # Check emergency keywords
    is_emerg, emerg_text = detect_emergency(user_text)

    # Gather contextual data for the user
    recent_bp = (
        db.query(HealthMeasurement)
        .filter(HealthMeasurement.user_id == current_user.id, HealthMeasurement.type == "blood_pressure")
        .order_by(HealthMeasurement.recorded_at.desc())
        .first()
    )
    recent_hr = (
        db.query(HealthMeasurement)
        .filter(HealthMeasurement.user_id == current_user.id, HealthMeasurement.type == "heart_rate")
        .order_by(HealthMeasurement.recorded_at.desc())
        .first()
    )
    recent_sleep = (
        db.query(HealthMeasurement)
        .filter(HealthMeasurement.user_id == current_user.id, HealthMeasurement.type == "sleep")
        .order_by(HealthMeasurement.recorded_at.desc())
        .first()
    )

    vitals_context = {}
    if recent_bp:
        vitals_context["blood_pressure"] = f"{recent_bp.value_primary}/{recent_bp.value_secondary or 80} mmHg"
    if recent_hr:
        vitals_context["heart_rate"] = f"{recent_hr.value_primary} bpm"
    if recent_sleep:
        vitals_context["sleep"] = f"{recent_sleep.value_primary} hours"

    user_context = {
        "name": current_user.full_name,
        "recent_vitals": vitals_context,
        "dietary_preference": current_user.profile.dietary_preference if current_user.profile else None,
        "allergies": current_user.profile.allergies if current_user.profile else None,
        "conditions": current_user.profile.medical_conditions if current_user.profile else None,
    }

    # Fetch last messages for context (configurable limit)
    from app.config import settings
    history_limit = getattr(settings, "ai_history_limit", 10)
    past_messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.conversation_id == convo.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )[-history_limit:]

    formatted_messages = []
    for m in past_messages:
        content = m.content
        if m.role == "assistant" and "\n\n---\n*Disclaimer:" in content:
            content = content.split("\n\n---\n*Disclaimer:")[0].strip()
        formatted_messages.append({"role": m.role, "content": content})

    assistant_text = await query_llm(formatted_messages, user_context)

    # Save assistant message
    asst_msg = ChatMessage(
        conversation_id=convo.id,
        user_id=current_user.id,
        role="assistant",
        content=assistant_text,
    )
    db.add(asst_msg)
    db.commit()
    db.refresh(asst_msg)

    # Auto-update conversation title if it's default
    if convo.title == "New Health Consultation" or convo.title == "Health & Wellness Chat":
        words = user_text.split()[:5]
        convo.title = " ".join(words).capitalize()
        db.commit()

    return AssistantReplyResponse(
        conversation_id=convo.id,
        user_message=ChatMessageResponse.model_validate(user_msg),
        assistant_message=ChatMessageResponse.model_validate(asst_msg),
        is_emergency=is_emerg,
        emergency_guidance=emerg_text,
        suggested_actions=[
            "Design a 15-min stretch routine",
            "Explain my blood pressure trends",
            "What should I ask my doctor?",
            "Healthy dinner ideas for tonight",
        ],
    )
