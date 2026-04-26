import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Incident, Task, Suggestion
from app.services.workflow_rules import generate_rule_based_suggestions
from app.services.rag_service import get_openai


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

    return f"""Incident: {incident.title}
Phase: {incident.phase}
Severity: {incident.severity or 'not set'}
Description: {incident.description[:500]}
GDPR Applicable: {incident.gdpr_applicable}
NIS2 Applicable: {incident.nis2_applicable}
Notifiability Assessment: {incident.notifiability_assessment or 'pending'}
Risk Classification: {incident.risk_classification or 'pending'}
Notification Decision: {incident.notification_decision or 'pending'}

Tasks:
{task_summary or '(none)'}"""


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
Given the current incident state, suggest 1-3 additional next steps that the rule-based engine has NOT already suggested.

Current incident context:
{context}

Already suggested by rules:
{json.dumps(rule_titles, indent=2)}

Return a JSON array where each element has:
- "title": short action title
- "description": explanation of why this step matters
- "recommended_action": one of "dispatch_task", "escalation", "review"
- "target_role": one of "iso", "ciso", "dpo", "legal", "itsec", "sysadmin", "communications", "compliance"

Only return the JSON array, no other text."""

    try:
        completion = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=800,
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
            recommended_action=s.get("recommended_action", "review"),
            target_role=s.get("target_role"),
            status="pending",
        )
        db.add(sug)
        created.append(sug)

    await db.commit()
    for s in created:
        await db.refresh(s)
    return created
