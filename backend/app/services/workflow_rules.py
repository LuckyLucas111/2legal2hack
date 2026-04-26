from datetime import datetime

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Incident, Task, Suggestion


async def _has_task(db: AsyncSession, incident_id: int, role: str, task_type: str | None = None) -> bool:
    q = select(func.count()).select_from(Task).where(
        Task.incident_id == incident_id,
        Task.assigned_to_role == role,
        Task.status != "cancelled",
    )
    if task_type:
        q = q.where(Task.task_type == task_type)
    result = await db.execute(q)
    return (result.scalar() or 0) > 0


async def _has_completed_task(db: AsyncSession, incident_id: int, role: str, task_type: str | None = None) -> bool:
    q = select(func.count()).select_from(Task).where(
        Task.incident_id == incident_id,
        Task.assigned_to_role == role,
        Task.status == "completed",
    )
    if task_type:
        q = q.where(Task.task_type == task_type)
    result = await db.execute(q)
    return (result.scalar() or 0) > 0


async def _existing_suggestions(db: AsyncSession, incident_id: int) -> set[str]:
    result = await db.execute(
        select(Suggestion.title).where(
            Suggestion.incident_id == incident_id,
        )
    )
    return {row[0] for row in result.all()}


async def generate_rule_based_suggestions(
    db: AsyncSession, incident: Incident
) -> list[dict]:
    suggestions: list[dict] = []
    existing = await _existing_suggestions(db, incident.id)

    def add(title: str, desc: str, action: str, target: str, priority: int = 50):
        if title not in existing:
            suggestions.append({
                "title": title,
                "description": desc,
                "recommended_action": action,
                "target_role": target,
                "priority": priority,
            })

    itsec_done = await _has_completed_task(db, incident.id, "itsec")
    dpo_done = await _has_completed_task(db, incident.id, "dpo", "assessment")
    legal_done = await _has_completed_task(db, incident.id, "legal", "assessment")

    # Sequential workflow: IT-Sec -> DPO -> Legal -> Communications/Compliance
    if not await _has_task(db, incident.id, "itsec"):
        add(
            "Request IT-Sec Forensic Report",
            "IT Security should investigate the incident, identify attack vectors, and document indicators of compromise.",
            "dispatch_task",
            "itsec",
            100,
        )

    if itsec_done and not await _has_task(db, incident.id, "dpo", "assessment"):
        add(
            "Request DPO Notifiability Assessment",
            "IT-Sec forensic report is complete. A Data Protection Officer should now assess whether this incident is notifiable under GDPR Art. 33.",
            "dispatch_task",
            "dpo",
            90,
        )

    if dpo_done and not await _has_task(db, incident.id, "legal", "assessment"):
        add(
            "Request Legal Risk Classification",
            "DPO assessment is complete. Legal counsel should now classify the risk level of this incident under GDPR.",
            "dispatch_task",
            "legal",
            85,
        )

    if legal_done and not await _has_task(db, incident.id, "communications"):
        add(
            "Request Communication Strategy",
            "Legal assessment is complete. The Communications team should prepare messaging for affected stakeholders.",
            "dispatch_task",
            "communications",
            70,
        )
    if legal_done and not await _has_task(db, incident.id, "compliance", "review"):
        add(
            "Request Compliance Sign-off",
            "Legal assessment is complete. Compliance should review the incident documentation for regulatory completeness.",
            "dispatch_task",
            "compliance",
            60,
        )

    if not await _has_task(db, incident.id, "sysadmin", "info_request"):
        add(
            "Request Technical Details from SysAdmin",
            "SysAdmin should provide detailed technical information about affected systems and initial containment measures.",
            "dispatch_task",
            "sysadmin",
            70,
        )

    if incident.notifiability_assessment and incident.risk_classification and not incident.notification_decision:
        add(
            "Request CISO Notification Decision",
            "Both DPO and Legal assessments are complete. The CISO should now decide whether to notify the supervisory authority.",
            "dispatch_task",
            "ciso",
            95,
        )

    if incident.gdpr_deadline:
        remaining = (incident.gdpr_deadline - datetime.utcnow()).total_seconds() / 3600
        if 0 < remaining < 24:
            add(
                "GDPR Deadline Warning: Less than 24h remaining",
                f"Only {remaining:.0f} hours remain until the GDPR 72h notification deadline. Ensure all necessary steps are completed.",
                "escalation",
                "iso",
                100,
            )
        elif remaining <= 0:
            add(
                "GDPR Deadline EXPIRED",
                "The GDPR 72h notification deadline has passed. Document the reasons for delay and proceed with notification immediately.",
                "escalation",
                "iso",
                100,
            )

    if incident.nis2_early_warning_deadline:
        remaining = (incident.nis2_early_warning_deadline - datetime.utcnow()).total_seconds() / 3600
        if 0 < remaining < 12:
            add(
                "NIS2 Early Warning Deadline Approaching",
                f"Only {remaining:.0f} hours remain for the NIS2 24h early warning. Ensure initial notification is prepared.",
                "escalation",
                "iso",
                100,
            )

    has_report_task = await _has_task(db, incident.id, "iso", "report")
    if not has_report_task and incident.notification_decision:
        add(
            "Generate Final Incident Report",
            "With the notification decision made, the ISO should generate the final incident report summarizing all findings.",
            "generate_report",
            "iso",
            60,
        )

    suggestions.sort(key=lambda s: -s["priority"])
    return suggestions
