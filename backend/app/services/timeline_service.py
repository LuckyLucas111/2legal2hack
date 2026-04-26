import json
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.event import Event


async def log_event(
    db: AsyncSession,
    incident_id: int,
    event_type: str,
    description: str,
    role: str,
    metadata: dict | None = None,
):
    event = Event(
        incident_id=incident_id,
        event_type=event_type,
        description=description,
        role=role,
        metadata_json=json.dumps(metadata) if metadata else None,
    )
    db.add(event)
    await db.flush()
    return event
