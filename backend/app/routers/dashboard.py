from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.incident import Incident
from app.models.task import Task
from app.models.event import Event
from app.schemas.incident import IncidentResponse
from app.schemas.task import TaskResponse
from app.schemas.event import EventResponse

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/")
async def get_dashboard(
    role: str = Query(default="iso"),
    db: AsyncSession = Depends(get_db),
):
    incidents_result = await db.execute(
        select(Incident)
        .where(Incident.phase != "closed")
        .order_by(Incident.created_at.desc())
    )
    incidents = incidents_result.scalars().all()

    tasks_query = select(Task).where(Task.status.in_(["pending", "in_progress"]))
    if role != "iso":
        tasks_query = tasks_query.where(Task.assigned_to_role == role)
    tasks_result = await db.execute(tasks_query.order_by(Task.created_at.desc()).limit(20))
    pending_tasks = tasks_result.scalars().all()

    events_result = await db.execute(
        select(Event)
        .order_by(Event.created_at.desc())
        .limit(20)
    )
    recent_events = events_result.scalars().all()

    task_count_query = select(func.count()).select_from(Task).where(
        Task.status.in_(["pending", "in_progress"])
    )
    if role != "iso":
        task_count_query = task_count_query.where(Task.assigned_to_role == role)
    task_count_result = await db.execute(task_count_query)
    pending_task_count = task_count_result.scalar() or 0

    return {
        "active_incidents": [IncidentResponse.model_validate(i) for i in incidents],
        "pending_tasks": [TaskResponse.model_validate(t) for t in pending_tasks],
        "recent_events": [EventResponse.model_validate(e) for e in recent_events],
        "pending_task_count": pending_task_count,
    }
