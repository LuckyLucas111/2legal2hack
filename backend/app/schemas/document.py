from datetime import datetime
from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: int
    incident_id: int
    filename: str
    file_type: str
    uploaded_by_role: str
    description: str | None
    embedded: bool
    created_at: datetime

    model_config = {"from_attributes": True}
