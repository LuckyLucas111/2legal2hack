import asyncio
import logging
import shutil
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, Header, HTTPException, UploadFile, File, Form
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.task import Task
from app.models.incident import Incident
from app.models.document import Document
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.services.overview_update_service import (
    apply_document_overview_update,
    apply_task_response_overview_update,
)
from app.services.timeline_service import log_event
from app.services.rag_service import embed_document, embed_task_response, extract_text
from app.services.legal_summary_service import generate_legal_summary
from app.config import UPLOAD_DIR

logger = logging.getLogger(__name__)

router = APIRouter(tags=["tasks"])


@router.get("/api/v1/incidents/{incident_id}/tasks", response_model=list[TaskResponse])
async def list_tasks(
    incident_id: int,
    role: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Task).where(Task.incident_id == incident_id).options(selectinload(Task.response_document))
    if role:
        query = query.where(Task.assigned_to_role == role)
    query = query.order_by(Task.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/api/v1/incidents/{incident_id}/tasks", response_model=TaskResponse, status_code=201)
async def create_task(
    incident_id: int,
    data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    x_role: str = Header(default="iso"),
):
    incident = await db.get(Incident, incident_id)
    if not incident:
        raise HTTPException(404, "Incident not found")

    description = data.description or ""
    if data.assigned_to_role == "legal" and data.task_type in ("assessment", None):
        try:
            summary = await asyncio.wait_for(
                generate_legal_summary(db, incident_id), timeout=30
            )
            if summary:
                description = (description + "\n\n" if description else "") + "---\n\n**Auto-generated legal briefing:**\n\n" + summary
        except Exception:
            pass

    task = Task(
        incident_id=incident_id,
        title=data.title,
        description=description,
        assigned_to_role=data.assigned_to_role,
        created_by_role=x_role,
        priority=data.priority,
        task_type=data.task_type,
        due_at=data.due_at,
    )
    db.add(task)
    await db.flush()

    await log_event(
        db, incident_id, "task_created",
        f"Task '{task.title}' assigned to {task.assigned_to_role} by {x_role}",
        x_role,
        {"task_id": task.id, "assigned_to": task.assigned_to_role},
    )
    await db.commit()
    await db.refresh(task, attribute_names=["response_document"])
    return task


@router.get("/api/v1/incidents/{incident_id}/tasks/{task_id}", response_model=TaskResponse)
async def get_task(incident_id: int, task_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Task).where(Task.id == task_id).options(selectinload(Task.response_document))
    )
    task = result.scalar_one_or_none()
    if not task or task.incident_id != incident_id:
        raise HTTPException(404, "Task not found")
    return task


@router.patch("/api/v1/incidents/{incident_id}/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    incident_id: int,
    task_id: int,
    status: str | None = Form(None),
    response: str | None = Form(None),
    priority: str | None = Form(None),
    file: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
    x_role: str = Header(default=""),
):
    task = await db.get(Task, task_id)
    if not task or task.incident_id != incident_id:
        raise HTTPException(404, "Task not found")

    changes: list[str] = []
    if status is not None:
        task.status = status
        changes.append("status")
    if response is not None:
        task.response = response
        changes.append("response")

        try:
            await embed_task_response(
                incident_id=incident_id,
                task_id=task_id,
                task_title=task.title,
                task_description=task.description or "",
                response_text=response,
                responding_role=x_role,
                created_by_role=task.created_by_role,
            )
        except Exception:
            logger.exception("Failed to embed task response for task %s", task_id)
    if priority is not None:
        task.priority = priority
        changes.append("priority")

    if file and file.filename:
        incident = await db.get(Incident, incident_id)
        if not incident:
            raise HTTPException(404, "Incident not found")

        incident_dir = UPLOAD_DIR / str(incident_id)
        incident_dir.mkdir(parents=True, exist_ok=True)
        safe_name = Path(file.filename).name
        filepath = incident_dir / safe_name
        with open(filepath, "wb") as f:
            shutil.copyfileobj(file.file, f)

        document_text = ""
        try:
            document_text = extract_text(str(filepath))
        except Exception:
            logger.exception("Failed to extract text from task document %s", safe_name)

        suffix = Path(safe_name).suffix.lower().lstrip(".")
        doc = Document(
            incident_id=incident_id,
            filename=safe_name,
            filepath=str(filepath),
            file_type=suffix or "unknown",
            uploaded_by_role=x_role,
            description=f"Attached to task: {task.title}",
            embedded=False,
        )
        db.add(doc)
        await db.flush()

        try:
            await embed_document(
                incident_id=incident_id,
                doc_id=doc.id,
                filename=safe_name,
                filepath=str(filepath),
                role=x_role,
            )
            doc.embedded = True
        except Exception:
            logger.exception("Failed to embed document %s (id=%s)", safe_name, doc.id)

        task.response_document_id = doc.id
        changes.append("file")
        overview_changes = apply_document_overview_update(
            incident,
            x_role,
            filename=safe_name,
            description=doc.description,
            text=document_text,
        )
    else:
        incident = None
        overview_changes = []

    if status == "completed":
        task.completed_at = datetime.utcnow()

    task.updated_at = datetime.utcnow()

    if response is not None or status == "completed":
        if incident is None:
            incident = await db.get(Incident, incident_id)
        if incident:
            overview_changes.extend(
                apply_task_response_overview_update(
                    incident,
                    x_role,
                    task_title=task.title,
                    response=response,
                )
            )

    event_desc = f"Task '{task.title}' updated by {x_role}"
    if status:
        event_desc = f"Task '{task.title}' status changed to {status} by {x_role}"
    if response:
        event_desc = f"Task '{task.title}' response submitted by {x_role}"

    await log_event(
        db, incident_id, "task_updated", event_desc, x_role,
        {"task_id": task_id, "changes": changes},
    )
    if overview_changes:
        await log_event(
            db,
            incident_id,
            "overview_updated",
            f"Overview auto-updated from {x_role} task response",
            x_role,
            {"task_id": task_id, "fields": overview_changes},
        )
    await db.commit()
    await db.refresh(task, attribute_names=["response_document"])
    return task


@router.get("/api/v1/tasks/by-role/{role}", response_model=list[TaskResponse])
async def get_tasks_by_role(role: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Task)
        .where(Task.assigned_to_role == role)
        .options(selectinload(Task.response_document))
        .order_by(Task.created_at.desc())
    )
    return result.scalars().all()
