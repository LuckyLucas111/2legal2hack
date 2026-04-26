import os
from datetime import datetime

from fpdf import FPDF
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Incident, Task, Event, Report
from app.services.rag_service import get_openai
from app.config import BASE_DIR


REPORT_DIR = BASE_DIR / "data" / "reports"
REPORT_DIR.mkdir(parents=True, exist_ok=True)


async def _gather_context(db: AsyncSession, incident: Incident) -> str:
    tasks_result = await db.execute(
        select(Task).where(Task.incident_id == incident.id).order_by(Task.created_at)
    )
    tasks = tasks_result.scalars().all()

    events_result = await db.execute(
        select(Event).where(Event.incident_id == incident.id).order_by(Event.created_at)
    )
    events = events_result.scalars().all()

    task_lines = []
    for t in tasks:
        line = f"- **{t.title}** (assigned to {t.assigned_to_role}, status: {t.status})"
        if t.response:
            line += f"\n  Response: {t.response[:500]}"
        task_lines.append(line)

    event_lines = [
        f"- [{e.created_at.strftime('%Y-%m-%d %H:%M')}] {e.description} (by {e.role})"
        for e in events
    ]

    return f"""## Incident Overview
- **Title:** {incident.title}
- **Severity:** {incident.severity or 'N/A'}
- **Created by:** {incident.created_by_role}
- **Detected at:** {incident.detected_at.strftime('%Y-%m-%d %H:%M UTC') if incident.detected_at else 'N/A'}

## Regulatory Assessment
- **GDPR Applicable:** {incident.gdpr_applicable}
- **NIS2 Applicable:** {incident.nis2_applicable}
- **Notifiability Assessment:** {incident.notifiability_assessment or 'Pending'}
- **Risk Classification:** {incident.risk_classification or 'Pending'}
- **Notification Decision:** {incident.notification_decision or 'Pending'}
- **Decision Reason:** {incident.notification_decision_reason or 'N/A'}

## Data Impact
- **Data Categories:** {incident.data_categories or 'N/A'}
- **Individuals Affected:** {incident.individuals_affected or 'N/A'}
- **Potential Harm:** {incident.potential_harm or 'N/A'}

## Deadlines
- **GDPR 72h:** {incident.gdpr_deadline.strftime('%Y-%m-%d %H:%M UTC') if incident.gdpr_deadline else 'N/A'}
- **NIS2 24h Early Warning:** {incident.nis2_early_warning_deadline.strftime('%Y-%m-%d %H:%M UTC') if incident.nis2_early_warning_deadline else 'N/A'}
- **NIS2 72h Report:** {incident.nis2_report_deadline.strftime('%Y-%m-%d %H:%M UTC') if incident.nis2_report_deadline else 'N/A'}

## Tasks & Responses
{chr(10).join(task_lines) or '(No tasks)'}

## Timeline
{chr(10).join(event_lines) or '(No events)'}

## Description
{incident.description}"""


async def generate_report_content(db: AsyncSession, incident_id: int) -> str:
    incident = await db.get(Incident, incident_id)
    if not incident:
        raise ValueError("Incident not found")

    context = await _gather_context(db, incident)

    try:
        client = get_openai()
        completion = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": """You are an expert incident response report writer for GDPR/NIS2 compliance.
Generate a comprehensive, professional incident report in Markdown format.

The report should include:
1. Executive Summary
2. Incident Description & Timeline
3. Impact Assessment (data categories, affected individuals, potential harm)
4. Regulatory Analysis (GDPR Art. 33/34, NIS2 obligations)
5. Actions Taken (tasks completed, responses received)
6. Notification Decision & Rationale
7. Recommendations & Next Steps

Use formal, precise language appropriate for regulatory submission. Reference specific GDPR articles and NIS2 provisions where applicable.""",
                },
                {
                    "role": "user",
                    "content": f"Generate the incident report based on this data:\n\n{context}",
                },
            ],
            temperature=0.3,
            max_tokens=3000,
        )
        return completion.choices[0].message.content or ""
    except Exception:
        return f"# Incident Report: {incident.title}\n\n{context}"


def generate_pdf(content: str, incident_title: str, incident_id: int) -> str:
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 12, "Incident Response Report", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(4)

    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 8, incident_title, new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.cell(
        0, 8,
        f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
        new_x="LMARGIN", new_y="NEXT", align="C",
    )
    pdf.ln(8)

    for line in content.split("\n"):
        line = line.rstrip()
        if line.startswith("# "):
            pdf.ln(4)
            pdf.set_font("Helvetica", "B", 16)
            pdf.multi_cell(0, 8, line[2:])
        elif line.startswith("## "):
            pdf.ln(3)
            pdf.set_font("Helvetica", "B", 13)
            pdf.multi_cell(0, 7, line[3:])
        elif line.startswith("### "):
            pdf.ln(2)
            pdf.set_font("Helvetica", "B", 11)
            pdf.multi_cell(0, 6, line[4:])
        elif line.startswith("- **"):
            pdf.set_font("Helvetica", "", 10)
            clean = line.replace("**", "")
            pdf.multi_cell(0, 6, f"  {clean}")
        elif line.startswith("- "):
            pdf.set_font("Helvetica", "", 10)
            pdf.multi_cell(0, 6, f"  {line}")
        elif line.strip():
            pdf.set_font("Helvetica", "", 10)
            pdf.multi_cell(0, 6, line)
        else:
            pdf.ln(3)

    filepath = str(REPORT_DIR / f"incident_{incident_id}_report.pdf")
    pdf.output(filepath)
    return filepath
