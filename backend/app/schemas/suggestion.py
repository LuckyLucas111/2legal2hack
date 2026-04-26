from datetime import datetime
from pydantic import BaseModel


class SuggestionUpdate(BaseModel):
    status: str


class SuggestionResponse(BaseModel):
    id: int
    incident_id: int
    suggestion_type: str
    title: str
    description: str
    recommended_action: str
    target_role: str | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
