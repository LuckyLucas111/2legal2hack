from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.event import Event
from app.schemas.event import EventResponse

router = APIRouter(prefix="/api/v1/incidents/{incident_id}/timeline", tags=["timeline"])


@router.get("/", response_model=list[EventResponse])
async def get_timeline(incident_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Event)
        .where(Event.incident_id == incident_id)
        .order_by(Event.created_at.desc())
    )
    return result.scalars().all()
