from datetime import datetime
from pydantic import BaseModel


class SuggestionUpdate(BaseModel):
    status: str | None = None
    title: str | None = None
    description: str | None = None
    target_role: str | None = None
    priority: str | None = None
    task_type: str | None = None


class SuggestionResponse(BaseModel):
    id: int
    incident_id: int
    suggestion_type: str
    title: str
    description: str
    recommended_action: str
    target_role: str | None
    priority: str | None = None
    task_type: str | None = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
