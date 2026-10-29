import datetime
from pydantic import BaseModel, ConfigDict


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    category: str
    document_date: str
    file_name: str
    file_size: int
    mime_type: str
    notes: str | None = None
    extracted_text: str | None = None
    ai_summary: str | None = None
    created_at: datetime.datetime


class DocumentQuestionRequest(BaseModel):
    question: str
