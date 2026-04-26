from sqlalchemy.ext.asyncio import AsyncSession

from app.models.incident import Incident
from app.services.mock_responses import MOCK_RESPONSES


async def generate_legal_summary(db: AsyncSession, incident_id: int) -> str:
    incident = await db.get(Incident, incident_id)
    if not incident:
        return ""

    return MOCK_RESPONSES["legal_summary"]
