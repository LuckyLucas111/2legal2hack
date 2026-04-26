from datetime import datetime
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.task import Task
from app.models.incident import Incident
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.services.timeline_service import log_event

router = APIRouter(tags=["tasks"])


@router.get("/api/v1/incidents/{incident_id}/tasks", response_model=list[TaskResponse])
async def list_tasks(
    incident_id: int,
    role: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Task).where(Task.incident_id == incident_id)
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

    task = Task(
        incident_id=incident_id,
        title=data.title,
        description=data.description,
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
    await db.refresh(task)
    return task


@router.get("/api/v1/incidents/{incident_id}/tasks/{task_id}", response_model=TaskResponse)
async def get_task(incident_id: int, task_id: int, db: AsyncSession = Depends(get_db)):
    task = await db.get(Task, task_id)
    if not task or task.incident_id != incident_id:
        raise HTTPException(404, "Task not found")
    return task


@router.patch("/api/v1/incidents/{incident_id}/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    incident_id: int,
    task_id: int,
    data: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    x_role: str = Header(default=""),
):
    task = await db.get(Task, task_id)
    if not task or task.incident_id != incident_id:
        raise HTTPException(404, "Task not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)

    if data.status == "completed":
        task.completed_at = datetime.utcnow()

    task.updated_at = datetime.utcnow()

    event_desc = f"Task '{task.title}' updated by {x_role}"
    if data.status:
        event_desc = f"Task '{task.title}' status changed to {data.status} by {x_role}"
    if data.response:
        event_desc = f"Task '{task.title}' response submitted by {x_role}"

    await log_event(
        db, incident_id, "task_updated", event_desc, x_role,
        {"task_id": task_id, "changes": list(update_data.keys())},
    )
    await db.commit()
    await db.refresh(task)
    return task


@router.get("/api/v1/tasks/by-role/{role}", response_model=list[TaskResponse])
async def get_tasks_by_role(role: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Task)
        .where(Task.assigned_to_role == role)
        .order_by(Task.created_at.desc())
    )
    return result.scalars().all()
