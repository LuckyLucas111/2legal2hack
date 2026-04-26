from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Incident, Task, Suggestion
from app.services.workflow_rules import generate_rule_based_suggestions
from app.services.mock_responses import MOCK_RESPONSES

FIELD_ROLE_MAP = {
    "severity": ("iso", "Incident severity classification"),
    "gdpr_applicable": ("dpo", "Whether GDPR applies to this incident"),
    "nis2_applicable": ("compliance", "Whether NIS2 applies to this incident"),
    "data_categories": ("dpo", "Categories of personal data affected"),
    "individuals_affected": ("dpo", "Number of individuals whose data is affected"),
    "potential_harm": ("dpo", "Assessment of potential harm to affected individuals"),
    "notifiability_assessment": ("dpo", "GDPR Art. 33 notifiability assessment"),
    "risk_classification": ("legal", "Legal risk classification of the incident"),
    "notification_decision": ("ciso", "Decision whether to notify the supervisory authority"),
    "notification_decision_reason": ("ciso", "Reasoning behind the notification decision"),
}


async def _incident_context(db: AsyncSession, incident: Incident) -> str:
    result = await db.execute(
        select(Task).where(Task.incident_id == incident.id)
    )
    tasks = result.scalars().all()

    task_summary = "\n".join(
        f"- [{t.status}] {t.title} (assigned to {t.assigned_to_role}, type: {t.task_type})"
        + (f" Response: {t.response[:200]}" if t.response else "")
        for t in tasks
    )

    missing = []
    for field, (role, desc) in FIELD_ROLE_MAP.items():
        value = getattr(incident, field, None)
        if value is None or value == "":
            missing.append(f"- {field} ({desc}) → responsible role: {role}")

    missing_section = "\n".join(missing) if missing else "(all key fields are filled)"

    return f"""Incident: {incident.title}
Severity: {incident.severity or 'not set'}
Description: {incident.description[:500]}
GDPR Applicable: {incident.gdpr_applicable}
NIS2 Applicable: {incident.nis2_applicable}
Data Categories: {incident.data_categories or 'not set'}
Individuals Affected: {incident.individuals_affected or 'not set'}
Potential Harm: {incident.potential_harm or 'not set'}
Notifiability Assessment: {incident.notifiability_assessment or 'pending'}
Risk Classification: {incident.risk_classification or 'pending'}
Notification Decision: {incident.notification_decision or 'pending'}

Tasks:
{task_summary or '(none)'}

Missing data fields that still need to be filled:
{missing_section}"""


async def generate_ai_suggestions(
    db: AsyncSession, incident: Incident, rule_suggestions: list[dict]
) -> list[dict]:
    existing_result = await db.execute(
        select(Suggestion.title).where(Suggestion.incident_id == incident.id)
    )
    existing_titles = {row[0] for row in existing_result.all()}
    rule_titles = {s["title"] for s in rule_suggestions}
    return [
        s
        for s in MOCK_RESPONSES["ai_suggestions"]
        if s["title"] not in rule_titles and s["title"] not in existing_titles
    ]


async def generate_suggestions(db: AsyncSession, incident_id: int) -> list[Suggestion]:
    incident = await db.get(Incident, incident_id)
    if not incident:
        return []

    rule_suggestions = await generate_rule_based_suggestions(db, incident)

    ai_suggestions = await generate_ai_suggestions(db, incident, rule_suggestions)

    created: list[Suggestion] = []

    for s in rule_suggestions:
        sug = Suggestion(
            incident_id=incident_id,
            suggestion_type="rule_based",
            title=s["title"],
            description=s["description"],
            recommended_action=s["recommended_action"],
            target_role=s.get("target_role"),
            priority=s.get("priority"),
            task_type=None,
            status="pending",
        )
        db.add(sug)
        created.append(sug)

    for s in ai_suggestions:
        sug = Suggestion(
            incident_id=incident_id,
            suggestion_type="ai_generated",
            title=s.get("title", "AI Suggestion"),
            description=s.get("description", ""),
            recommended_action=s.get("recommended_action", "dispatch_task"),
            target_role=s.get("target_role"),
            priority=s.get("priority"),
            task_type=s.get("task_type"),
            status="pending",
        )
        db.add(sug)
        created.append(sug)

    await db.commit()
    for s in created:
        await db.refresh(s)
    return created
