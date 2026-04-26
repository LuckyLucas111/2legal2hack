from datetime import datetime
from pydantic import BaseModel


class IncidentCreate(BaseModel):
    title: str
    description: str
    severity: str | None = None
    detected_at: datetime | None = None


class IncidentUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    severity: str | None = None
    gdpr_applicable: bool | None = None
    nis2_applicable: bool | None = None
    data_categories: str | None = None
    individuals_affected: int | None = None
    potential_harm: str | None = None


class NotifiabilityAssessment(BaseModel):
    notifiability_assessment: str
    gdpr_applicable: bool | None = None
    data_categories: str | None = None
    individuals_affected: int | None = None
    potential_harm: str | None = None


class RiskClassification(BaseModel):
    risk_classification: str
    gdpr_applicable: bool | None = None


class NotificationDecision(BaseModel):
    notification_decision: str
    notification_decision_reason: str | None = None


class IncidentResponse(BaseModel):
    id: int
    title: str
    description: str
    severity: str | None
    gdpr_applicable: bool | None
    nis2_applicable: bool | None
    notifiability_assessment: str | None
    risk_classification: str | None
    notification_decision: str | None
    notification_decision_reason: str | None
    data_categories: str | None
    individuals_affected: int | None
    potential_harm: str | None
    created_by_role: str
    detected_at: datetime
    gdpr_deadline: datetime | None
    nis2_early_warning_deadline: datetime | None
    nis2_report_deadline: datetime | None
    nis2_final_report_deadline: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
