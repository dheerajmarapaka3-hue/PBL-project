import os
from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.document import MedicalDocument
from app.schemas.document import DocumentResponse, DocumentQuestionRequest
from app.services.auth_service import get_current_user
from app.services.document_service import save_upload_file, extract_text_from_file
from app.services.ai_service import summarize_report_text, query_llm

router = APIRouter(prefix="/documents", tags=["Medical Reports"])


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form("Lab Report"),
    document_date: str = Form(...),
    notes: str | None = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Save file securely to uploads directory
    file_path, safe_filename, file_size = save_upload_file(file, settings.upload_dir)

    # Extract text from PDF / document
    extracted = extract_text_from_file(file_path, file.content_type or "")

    # Generate AI plain language summary
    summary = summarize_report_text(extracted)

    doc = MedicalDocument(
        user_id=current_user.id,
        title=title.strip(),
        category=category.strip(),
        document_date=document_date.strip(),
        file_name=file.filename or safe_filename,
        file_path=file_path,
        file_size=file_size,
        mime_type=file.content_type or "application/pdf",
        notes=notes,
        extracted_text=extracted,
        ai_summary=summary,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return DocumentResponse.model_validate(doc)


@router.get("/", response_model=list[DocumentResponse])
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    docs = (
        db.query(MedicalDocument)
        .filter(MedicalDocument.user_id == current_user.id)
        .order_by(MedicalDocument.created_at.desc())
        .all()
    )
    return [DocumentResponse.model_validate(d) for d in docs]


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = (
        db.query(MedicalDocument)
        .filter(MedicalDocument.id == document_id, MedicalDocument.user_id == current_user.id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Medical document not found or unauthorized.")
    return DocumentResponse.model_validate(doc)


@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = (
        db.query(MedicalDocument)
        .filter(MedicalDocument.id == document_id, MedicalDocument.user_id == current_user.id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Medical document not found or unauthorized.")

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Underlying document file could not be located on the server.")

    return FileResponse(
        path=doc.file_path,
        media_type=doc.mime_type,
        filename=doc.file_name,
    )


@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = (
        db.query(MedicalDocument)
        .filter(MedicalDocument.id == document_id, MedicalDocument.user_id == current_user.id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Medical document not found or unauthorized.")

    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    db.delete(doc)
    db.commit()
    return {"message": "Medical document and associated file deleted successfully."}


@router.post("/{document_id}/question")
async def ask_question_about_document(
    document_id: int,
    body: DocumentQuestionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = (
        db.query(MedicalDocument)
        .filter(MedicalDocument.id == document_id, MedicalDocument.user_id == current_user.id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Medical document not found or unauthorized.")

    prompt_context = {
        "document_title": doc.title,
        "document_category": doc.category,
        "document_date": doc.document_date,
        "extracted_text_preview": (doc.extracted_text or "")[:2000],
    }

    messages = [
        {
            "role": "user",
            "content": (
                f"I have a question about my uploaded document '{doc.title}'.\n"
                f"Question: {body.question}\n\n"
                f"Please explain in clear, reassuring, patient-friendly terms what the document says about this."
            ),
        }
    ]

    answer = await query_llm(messages, prompt_context)
    return {"answer": answer}
