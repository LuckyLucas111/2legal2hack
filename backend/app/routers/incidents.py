from datetime import datetime
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.incident import Incident
from app.schemas.incident import (
    IncidentCreate,
    IncidentUpdate,
    IncidentResponse,
    NotifiabilityAssessment,
    RiskClassification,
    NotificationDecision,
)
from app.services.timeline_service import log_event

router = APIRouter(prefix="/api/v1/incidents", tags=["incidents"])


@router.get("/", response_model=list[IncidentResponse])
async def list_incidents(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Incident).order_by(Incident.created_at.desc()))
    return result.scalars().all()


@router.post("/", response_model=IncidentResponse, status_code=201)
async def create_incident(
    data: IncidentCreate,
    db: AsyncSession = Depends(get_db),
    x_role: str = Header(default="sysadmin"),
):
    if x_role != "sysadmin":
        raise HTTPException(403, "Only SysAdmin can create incidents")

    incident = Incident(
        title=data.title,
        description=data.description,
        severity=data.severity,
        detected_at=data.detected_at or datetime.utcnow(),
        created_by_role="sysadmin",
    )
    db.add(incident)
    await db.flush()

    await log_event(
        db, incident.id, "incident_created",
        f"Incident '{incident.title}' created by SysAdmin",
        "sysadmin",
    )
    await db.commit()
    await db.refresh(incident)
    return incident


@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(incident_id: int, db: AsyncSession = Depends(get_db)):
    incident = await db.get(Incident, incident_id)
    if not incident:
        raise HTTPException(404, "Incident not found")
    return incident


@router.patch("/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: int,
    data: IncidentUpdate,
    db: AsyncSession = Depends(get_db),
    x_role: str = Header(default="iso"),
):
    incident = await db.get(Incident, incident_id)
    if not incident:
        raise HTTPException(404, "Incident not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(incident, key, value)
    incident.updated_at = datetime.utcnow()

    await log_event(
        db, incident_id, "incident_updated",
        f"Incident updated by {x_role}: {', '.join(update_data.keys())}",
        x_role,
    )
    await db.commit()
    await db.refresh(incident)
    return incident


@router.patch("/{incident_id}/notifiability", response_model=IncidentResponse)
async def submit_notifiability(
    incident_id: int,
    data: NotifiabilityAssessment,
    db: AsyncSession = Depends(get_db),
    x_role: str = Header(default="dpo"),
):
    if x_role != "dpo":
        raise HTTPException(403, "Only DPO can submit notifiability assessments")

    incident = await db.get(Incident, incident_id)
    if not incident:
        raise HTTPException(404, "Incident not found")

    incident.notifiability_assessment = data.notifiability_assessment
    if data.gdpr_applicable is not None:
        incident.gdpr_applicable = data.gdpr_applicable
    if data.data_categories is not None:
        incident.data_categories = data.data_categories
    if data.individuals_affected is not None:
        incident.individuals_affected = data.individuals_affected
    if data.potential_harm is not None:
        incident.potential_harm = data.potential_harm
    incident.updated_at = datetime.utcnow()

    await log_event(
        db, incident_id, "assessment_submitted",
        "DPO submitted notifiability assessment",
        "dpo",
    )
    await db.commit()
    await db.refresh(incident)
    return incident


@router.patch("/{incident_id}/risk-classification", response_model=IncidentResponse)
async def submit_risk_classification(
    incident_id: int,
    data: RiskClassification,
    db: AsyncSession = Depends(get_db),
    x_role: str = Header(default="legal"),
):
    if x_role != "legal":
        raise HTTPException(403, "Only Legal can submit risk classifications")

    incident = await db.get(Incident, incident_id)
    if not incident:
        raise HTTPException(404, "Incident not found")

    incident.risk_classification = data.risk_classification
    if data.gdpr_applicable is not None:
        incident.gdpr_applicable = data.gdpr_applicable
    incident.updated_at = datetime.utcnow()

    await log_event(
        db, incident_id, "assessment_submitted",
        f"Legal submitted risk classification: {data.risk_classification}",
        "legal",
    )
    await db.commit()
    await db.refresh(incident)
    return incident


@router.patch("/{incident_id}/notification-decision", response_model=IncidentResponse)
async def submit_notification_decision(
    incident_id: int,
    data: NotificationDecision,
    db: AsyncSession = Depends(get_db),
    x_role: str = Header(default="ciso"),
):
    if x_role != "ciso":
        raise HTTPException(403, "Only CISO can submit notification decisions")
    if data.notification_decision not in ("notify", "no_notify"):
        raise HTTPException(400, "notification_decision must be 'notify' or 'no_notify'")

    incident = await db.get(Incident, incident_id)
    if not incident:
        raise HTTPException(404, "Incident not found")

    incident.notification_decision = data.notification_decision
    incident.notification_decision_reason = data.notification_decision_reason
    incident.updated_at = datetime.utcnow()

    await log_event(
        db, incident_id, "decision_made",
        f"CISO notification decision: {data.notification_decision}",
        "ciso",
        {"decision": data.notification_decision, "reason": data.notification_decision_reason},
    )
    await db.commit()
    await db.refresh(incident)
    return incident
