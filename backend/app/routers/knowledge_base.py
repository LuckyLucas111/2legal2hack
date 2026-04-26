import json

from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import KBConversation
from app.services.rag_service import query_kb

router = APIRouter(prefix="/api/v1/incidents/{incident_id}/kb", tags=["knowledge_base"])


class KBQuery(BaseModel):
    query: str


class KBResponse(BaseModel):
    response: str
    sources: list[dict]


class KBHistoryItem(BaseModel):
    id: int
    role: str
    query: str
    response: str
    sources: list[dict] | None
    created_at: str

    model_config = {"from_attributes": True}


@router.post("/query", response_model=KBResponse)
async def query_knowledge_base(
    incident_id: int,
    body: KBQuery,
    x_role: str = Header(..., alias="X-Role"),
    db: AsyncSession = Depends(get_db),
):
    result = await query_kb(incident_id, body.query, x_role)

    conv = KBConversation(
        incident_id=incident_id,
        role=x_role,
        query=body.query,
        response=result["response"],
        sources=json.dumps(result["sources"]),
    )
    db.add(conv)
    await db.commit()

    return result


@router.get("/history", response_model=list[KBHistoryItem])
async def get_kb_history(
    incident_id: int,
    x_role: str = Header(..., alias="X-Role"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(KBConversation)
        .where(
            KBConversation.incident_id == incident_id,
            KBConversation.role == x_role,
        )
        .order_by(KBConversation.created_at.desc())
    )
    convos = result.scalars().all()
    items = []
    for c in convos:
        sources = None
        if c.sources:
            try:
                sources = json.loads(c.sources)
            except json.JSONDecodeError:
                pass
        items.append(
            KBHistoryItem(
                id=c.id,
                role=c.role,
                query=c.query,
                response=c.response,
                sources=sources,
                created_at=c.created_at.isoformat(),
            )
        )
    return items
