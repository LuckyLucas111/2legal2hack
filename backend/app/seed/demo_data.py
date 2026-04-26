"""Seed script to populate the database with demo data for the happy-path walkthrough."""

import asyncio
import json
from datetime import datetime, timedelta

from app.database import engine, async_session, Base
from app.models.incident import Incident
from app.models.task import Task
from app.models.event import Event
from app.models.suggestion import Suggestion


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        now = datetime.utcnow()

        # ── Incident 1: active, in "assessment" phase ────────────────────
        inc1 = Incident(
            title="Ransomware attack on customer database server",
            description=(
                "On 2026-04-25 at 03:17 UTC the monitoring system detected unusual "
                "encryption activity on db-prod-02. The server hosts the customer "
                "relationship management (CRM) database containing ~120 000 personal "
                "records including names, emails, phone numbers, and hashed passwords. "
                "The attack vector appears to be CVE-2026-1234 in the SSH daemon. "
                "The affected server has been isolated and a forensic image taken."
            ),
            phase="assessment",
            severity="critical",
            gdpr_applicable=True,
            nis2_applicable=True,
            detected_at=now - timedelta(hours=8),
            created_by_role="sysadmin",
        )
        db.add(inc1)
        await db.flush()

        # Tasks for incident 1
        tasks1 = [
            Task(
                incident_id=inc1.id,
                title="Perform DPO notifiability assessment",
                description="Assess whether this breach requires notification under GDPR Art. 33. Evaluate data categories, number of individuals affected, and potential harm.",
                assigned_to_role="dpo",
                created_by_role="iso",
                status="completed",
                priority="high",
                task_type="assessment",
                response="GDPR Art. 33 notification required. Personal data of ~120k individuals compromised including contact details. Risk of identity theft and phishing. Recommend notification within 72h deadline.",
                completed_at=now - timedelta(hours=5),
            ),
            Task(
                incident_id=inc1.id,
                title="Legal risk classification",
                description="Classify the risk level of this data breach under GDPR and assess potential regulatory exposure.",
                assigned_to_role="legal",
                created_by_role="iso",
                status="completed",
                priority="high",
                task_type="assessment",
                response="Risk classification: HIGH. Large-scale breach of personal data with potential for significant harm. Regulatory fine exposure up to 4% annual turnover. Recommend immediate supervisory authority notification.",
                completed_at=now - timedelta(hours=4),
            ),
            Task(
                incident_id=inc1.id,
                title="Conduct forensic analysis and security report",
                description="Analyze the attack vector, scope of compromise, and prepare a technical security report.",
                assigned_to_role="itsec",
                created_by_role="iso",
                status="in_progress",
                priority="high",
                task_type="report",
            ),
            Task(
                incident_id=inc1.id,
                title="Provide technical details on affected infrastructure",
                description="Document all affected systems, network segments, and any lateral movement detected.",
                assigned_to_role="sysadmin",
                created_by_role="iso",
                status="completed",
                priority="medium",
                task_type="info_request",
                response="Affected: db-prod-02 (CRM PostgreSQL), backup NAS share \\\\nas-01\\crm-backup. No lateral movement detected. Firewall logs confirm external SSH connection from 198.51.100.42. Server isolated at 03:45 UTC.",
                completed_at=now - timedelta(hours=6),
            ),
        ]
        for t in tasks1:
            db.add(t)

        # Timeline events for incident 1
        events1 = [
            Event(incident_id=inc1.id, event_type="incident_created", description="Incident 'Ransomware attack on customer database server' created by SysAdmin", role="sysadmin", created_at=now - timedelta(hours=8)),
            Event(incident_id=inc1.id, event_type="phase_change", description="Phase changed from 'draft' to 'triage' by ISO", role="iso", metadata_json=json.dumps({"old_phase": "draft", "new_phase": "triage"}), created_at=now - timedelta(hours=7, minutes=50)),
            Event(incident_id=inc1.id, event_type="task_created", description="Task 'Perform DPO notifiability assessment' dispatched to DPO", role="iso", created_at=now - timedelta(hours=7, minutes=45)),
            Event(incident_id=inc1.id, event_type="task_created", description="Task 'Legal risk classification' dispatched to Legal", role="iso", created_at=now - timedelta(hours=7, minutes=44)),
            Event(incident_id=inc1.id, event_type="task_created", description="Task 'Provide technical details on affected infrastructure' dispatched to SysAdmin", role="iso", created_at=now - timedelta(hours=7, minutes=43)),
            Event(incident_id=inc1.id, event_type="task_completed", description="SysAdmin completed task: Provide technical details on affected infrastructure", role="sysadmin", created_at=now - timedelta(hours=6)),
            Event(incident_id=inc1.id, event_type="assessment_submitted", description="DPO submitted notifiability assessment", role="dpo", created_at=now - timedelta(hours=5)),
            Event(incident_id=inc1.id, event_type="phase_change", description="Phase changed from 'triage' to 'assessment' by ISO", role="iso", metadata_json=json.dumps({"old_phase": "triage", "new_phase": "assessment"}), created_at=now - timedelta(hours=4, minutes=30)),
            Event(incident_id=inc1.id, event_type="assessment_submitted", description="Legal submitted risk classification: HIGH", role="legal", created_at=now - timedelta(hours=4)),
            Event(incident_id=inc1.id, event_type="task_created", description="Task 'Conduct forensic analysis and security report' dispatched to IT-Sec", role="iso", created_at=now - timedelta(hours=3, minutes=30)),
        ]
        for e in events1:
            db.add(e)

        # Suggestions for incident 1
        suggestions1 = [
            Suggestion(incident_id=inc1.id, suggestion_type="rule_based", title="Request CISO notification decision", description="Both DPO and Legal assessments are complete. The CISO should now make the final notification decision.", recommended_action="dispatch_task", target_role="ciso", status="pending"),
            Suggestion(incident_id=inc1.id, suggestion_type="rule_based", title="Prepare communications strategy", description="Given the scale of the breach, a communications strategy should be prepared for affected individuals and stakeholders.", recommended_action="dispatch_task", target_role="communications", status="pending"),
            Suggestion(incident_id=inc1.id, suggestion_type="ai_generated", title="Engage external incident response firm", description="Given the sophistication of the ransomware attack and the CVE exploitation, consider engaging an external DFIR firm for independent forensic validation.", recommended_action="dispatch_task", target_role="iso", status="pending"),
        ]
        for s in suggestions1:
            db.add(s)

        # Update incident 1 assessments
        inc1.notifiability_assessment = "Notification required under GDPR Art. 33. Personal data of ~120k individuals compromised."
        inc1.risk_classification = "high"

        # ── Incident 2: fresh, in "draft" phase ─────────────────────────
        inc2 = Incident(
            title="Phishing campaign targeting finance department",
            description=(
                "Multiple employees in the finance department received convincing "
                "phishing emails impersonating the CFO requesting wire transfers. "
                "Two employees clicked the link and entered credentials on a fake "
                "login page. No financial transactions were initiated. The phishing "
                "domain has been reported and blocked at the firewall level."
            ),
            phase="draft",
            severity="medium",
            detected_at=now - timedelta(hours=2),
            created_by_role="sysadmin",
        )
        db.add(inc2)
        await db.flush()

        events2 = [
            Event(incident_id=inc2.id, event_type="incident_created", description="Incident 'Phishing campaign targeting finance department' created by SysAdmin", role="sysadmin", created_at=now - timedelta(hours=2)),
        ]
        for e in events2:
            db.add(e)

        # ── Incident 3: closed ───────────────────────────────────────────
        inc3 = Incident(
            title="Accidental exposure of internal API keys in public repo",
            description=(
                "A developer accidentally pushed a configuration file containing "
                "internal API keys to a public GitHub repository. The keys provided "
                "read-only access to non-personal telemetry data. Keys were rotated "
                "within 30 minutes of detection."
            ),
            phase="closed",
            severity="low",
            gdpr_applicable=False,
            nis2_applicable=False,
            notification_decision="no_notify",
            notification_decision_reason="No personal data involved. Only internal telemetry API keys exposed. Keys rotated promptly.",
            detected_at=now - timedelta(days=3),
            created_by_role="sysadmin",
        )
        db.add(inc3)
        await db.flush()

        events3 = [
            Event(incident_id=inc3.id, event_type="incident_created", description="Incident 'Accidental exposure of internal API keys' created by SysAdmin", role="sysadmin", created_at=now - timedelta(days=3)),
            Event(incident_id=inc3.id, event_type="phase_change", description="Phase changed from 'draft' to 'closed' by ISO — no personal data involved", role="iso", created_at=now - timedelta(days=3, hours=-2)),
            Event(incident_id=inc3.id, event_type="decision_made", description="CISO notification decision: no_notify", role="ciso", created_at=now - timedelta(days=3, hours=-1)),
        ]
        for e in events3:
            db.add(e)

        await db.commit()
        print("Demo data seeded: 3 incidents, tasks, events, suggestions.")


if __name__ == "__main__":
    asyncio.run(seed())
