import os
import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Document, Incident
from app.schemas.document import DocumentResponse
from app.services.timeline_service import log_event
from app.services.rag_service import embed_document
from app.config import UPLOAD_DIR

router = APIRouter(prefix="/api/v1/incidents/{incident_id}/documents", tags=["documents"])


@router.get("/", response_model=list[DocumentResponse])
async def list_documents(
    incident_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(Document.incident_id == incident_id).order_by(Document.created_at.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=DocumentResponse)
async def upload_document(
    incident_id: int,
    file: UploadFile = File(...),
    description: str = Form(None),
    x_role: str = Header(..., alias="X-Role"),
    db: AsyncSession = Depends(get_db),
):
    incident = await db.get(Incident, incident_id)
    if not incident:
        raise HTTPException(404, "Incident not found")

    incident_dir = UPLOAD_DIR / str(incident_id)
    incident_dir.mkdir(parents=True, exist_ok=True)

    safe_name = Path(file.filename or "upload").name
    filepath = incident_dir / safe_name

    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    suffix = Path(safe_name).suffix.lower().lstrip(".")
    doc = Document(
        incident_id=incident_id,
        filename=safe_name,
        filepath=str(filepath),
        file_type=suffix or "unknown",
        uploaded_by_role=x_role,
        description=description,
        embedded=False,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    try:
        chunk_count = await embed_document(
            incident_id=incident_id,
            doc_id=doc.id,
            filename=safe_name,
            filepath=str(filepath),
            role=x_role,
        )
        doc.embedded = True
        await db.commit()
        await db.refresh(doc)
    except Exception:
        pass

    await log_event(
        db,
        incident_id=incident_id,
        event_type="document_uploaded",
        description=f"Document '{safe_name}' uploaded",
        role=x_role,
    )

    return doc


@router.get("/{document_id}/download")
async def download_document(
    incident_id: int,
    document_id: int,
    db: AsyncSession = Depends(get_db),
):
    doc = await db.get(Document, document_id)
    if not doc or doc.incident_id != incident_id:
        raise HTTPException(404, "Document not found")
    if not os.path.exists(doc.filepath):
        raise HTTPException(404, "File not found on disk")
    return FileResponse(doc.filepath, filename=doc.filename)


@router.delete("/{document_id}")
async def delete_document(
    incident_id: int,
    document_id: int,
    x_role: str = Header(..., alias="X-Role"),
    db: AsyncSession = Depends(get_db),
):
    doc = await db.get(Document, document_id)
    if not doc or doc.incident_id != incident_id:
        raise HTTPException(404, "Document not found")

    if os.path.exists(doc.filepath):
        os.remove(doc.filepath)

    await db.delete(doc)
    await db.commit()

    await log_event(
        db,
        incident_id=incident_id,
        event_type="document_deleted",
        description=f"Document '{doc.filename}' deleted",
        role=x_role,
    )

    return {"status": "deleted"}
