from datetime import datetime
from pydantic import BaseModel


class ReportCreate(BaseModel):
    content: str


class ReportResponse(BaseModel):
    id: int
    incident_id: int
    content: str
    generated_by: str
    pdf_path: str | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
