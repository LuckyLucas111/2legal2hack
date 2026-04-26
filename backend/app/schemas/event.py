from datetime import datetime
from pydantic import BaseModel


class EventResponse(BaseModel):
    id: int
    incident_id: int
    event_type: str
    description: str
    role: str
    metadata_json: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
