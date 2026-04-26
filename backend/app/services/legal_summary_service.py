from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.incident import Incident
from app.models.task import Task
from app.config import settings
from app.services.rag_service import get_openai, query_kb


async def generate_legal_summary(db: AsyncSession, incident_id: int) -> str:
    incident = await db.get(Incident, incident_id)
    if not incident:
        return ""

    completed_tasks = (
        await db.execute(
            select(Task)
            .where(Task.incident_id == incident_id, Task.status == "completed")
            .order_by(Task.created_at)
        )
    ).scalars().all()

    task_summaries: list[str] = []
    for t in completed_tasks:
        entry = f"- **{t.assigned_to_role.upper()}** – {t.title}"
        if t.response:
            entry += f"\n  Response: {t.response}"
        task_summaries.append(entry)

    kb_result = await query_kb(
        incident_id,
        "Summarize all uploaded documents relevant for a legal assessment of this incident, "
        "including technical findings, affected data, and potential regulatory implications.",
        role="legal",
        n_results=10,
    )

    sections = [
        f"**Incident:** {incident.title}",
        f"**Description:** {incident.description}",
        f"**Phase:** {incident.phase} | **Severity:** {incident.severity or 'not set'}",
    ]

    if incident.gdpr_applicable is not None:
        sections.append(f"**GDPR applicable:** {'Yes' if incident.gdpr_applicable else 'No'}")
    if incident.nis2_applicable is not None:
        sections.append(f"**NIS2 applicable:** {'Yes' if incident.nis2_applicable else 'No'}")
    if incident.data_categories:
        sections.append(f"**Data categories:** {incident.data_categories}")
    if incident.individuals_affected:
        sections.append(f"**Individuals affected:** {incident.individuals_affected}")
    if incident.potential_harm:
        sections.append(f"**Potential harm:** {incident.potential_harm}")
    if incident.notifiability_assessment:
        sections.append(f"**Notifiability assessment:** {incident.notifiability_assessment}")

    context_parts = ["\n".join(sections)]

    if task_summaries:
        context_parts.append("### Completed task responses\n" + "\n".join(task_summaries))

    if kb_result.get("response") and "No documents" not in kb_result["response"] and "No relevant" not in kb_result["response"]:
        context_parts.append("### Document analysis (KB)\n" + kb_result["response"])

    context = "\n\n".join(context_parts)

    client = get_openai()
    completion = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a legal briefing assistant for GDPR/NIS2 incident response. "
                    "Produce a concise legal summary in English that a lawyer can use to assess the incident. "
                    "Structure: 1) Facts of the incident, 2) Relevant regulatory framework (cite specific GDPR articles / NIS2 provisions), "
                    "3) Key findings from technical and DPO assessments, 4) Open legal questions. "
                    "Use precise legal terminology. Be factual — do not speculate."
                ),
            },
            {
                "role": "user",
                "content": f"Generate a legal briefing summary based on the following incident data:\n\n{context}",
            },
        ],
        temperature=0.2,
        max_tokens=1500,
    )

    return completion.choices[0].message.content or ""
