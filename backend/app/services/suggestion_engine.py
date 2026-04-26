import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Incident, Task, Suggestion
from app.services.workflow_rules import generate_rule_based_suggestions
from app.config import settings
from app.services.rag_service import get_openai

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
    try:
        client = get_openai()
    except Exception:
        return []

    context = await _incident_context(db, incident)
    rule_titles = [s["title"] for s in rule_suggestions]

    prompt = f"""You are an expert GDPR/NIS2 incident response advisor.

Analyze the current incident state below. Focus on:
1. MISSING DATA: For each missing field, suggest a specific task for the responsible role to provide that data. This is your primary focus.
2. WORKFLOW GAPS: Any additional next steps not covered by the rule-based suggestions.

Current incident context:
{context}

Already suggested by rules:
{json.dumps(rule_titles, indent=2)}

Return a JSON array where each element has:
- "title": short action title (imperative, e.g. "Assess GDPR applicability")
- "description": explanation of what data is needed and why it matters for the incident response
- "recommended_action": "dispatch_task"
- "target_role": one of "iso", "ciso", "dpo", "legal", "itsec", "sysadmin", "communications", "compliance"
- "priority": one of "critical", "high", "medium", "low"
- "task_type": one of "assessment", "report", "notification", "info_request", "review", "general"

Prioritize missing data that blocks notification and reporting decisions. Do not duplicate tasks that already exist or are already suggested by rules.
Only return the JSON array, no other text."""

    try:
        completion = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=1200,
        )
        raw = completion.choices[0].message.content or "[]"
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0]
        return json.loads(raw)
    except Exception:
        return []


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
