from datetime import datetime
from pydantic import BaseModel


class TaskCreate(BaseModel):
    title: str
    description: str = ""
    assigned_to_role: str
    priority: str = "medium"
    task_type: str = "general"
    due_at: datetime | None = None


class TaskUpdate(BaseModel):
    status: str | None = None
    response: str | None = None
    priority: str | None = None


class ResponseDocumentInfo(BaseModel):
    id: int
    filename: str
    file_type: str

    model_config = {"from_attributes": True}


class TaskResponse(BaseModel):
    id: int
    incident_id: int
    title: str
    description: str
    assigned_to_role: str
    created_by_role: str
    status: str
    priority: str
    task_type: str
    response: str | None
    response_document_id: int | None = None
    response_document: ResponseDocumentInfo | None = None
    due_at: datetime | None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}
