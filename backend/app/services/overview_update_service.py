import re
from datetime import datetime
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document
from app.models.task import Task


RISK_LEVELS = ("critical", "high", "medium", "low")


def _normalize(text: str | None) -> str:
    return (text or "").strip()


def _source_text(*parts: str | None) -> str:
    return "\n".join(_normalize(part) for part in parts if _normalize(part))


def _shorten(text: str, limit: int = 600) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= limit:
        return text
    return text[: limit - 3].rstrip() + "..."


def _extract_section(text: str, headings: tuple[str, ...], limit: int = 600) -> str | None:
    lines = text.splitlines()
    for index, line in enumerate(lines):
        heading = line.strip().strip("#").strip(":").lower()
        if not heading:
            continue
        if not any(candidate in heading for candidate in headings):
            continue

        collected: list[str] = []
        for next_line in lines[index + 1 :]:
            stripped = next_line.strip()
            if collected and stripped.startswith("#"):
                break
            if stripped:
                collected.append(stripped)
            if len(" ".join(collected)) >= limit:
                break

        if collected:
            return _shorten(" ".join(collected), limit)
    return None


def _parse_bool(text: str, positive: tuple[str, ...], negative: tuple[str, ...]) -> bool | None:
    lowered = text.lower()
    if any(pattern in lowered for pattern in negative):
        return False
    if any(pattern in lowered for pattern in positive):
        return True
    return None


def _parse_affected_count(text: str) -> int | None:
    patterns = (
        r"(\d{1,3}(?:[.,]\d{3})+|\d+)\s+(?:affected\s+)?(?:customers|customer records|data subjects|individuals|persons)",
        r"(?:customers|customer records|data subjects|individuals|persons)[^\d]{0,40}(\d{1,3}(?:[.,]\d{3})+|\d+)",
    )
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return int(match.group(1).replace(".", "").replace(",", ""))
    return None


def _parse_risk_level(text: str) -> str | None:
    patterns = (
        r"risk(?:\s+classification|\s+level)?\s*(?:is|:|-)?\s*(critical|high|medium|low)",
        r"classif(?:y|ies|ied)(?:\s+the\s+incident)?\s+as\s+(critical|high|medium|low)",
        r"(critical|high|medium|low)[-\s]+risk",
        r"severity\s*(?:is|:|-)?\s*(critical|high|medium|low)",
    )
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            value = match.group(1).lower()
            if value in RISK_LEVELS:
                return value
    return None


def _apply_values(incident, values: dict[str, object]) -> list[str]:
    changed: list[str] = []
    for field, value in values.items():
        if value is None:
            continue
        if getattr(incident, field, None) != value:
            setattr(incident, field, value)
            changed.append(field)

    if changed:
        incident.updated_at = datetime.utcnow()

    return changed


def apply_document_overview_update(
    incident,
    role: str,
    filename: str | None = None,
    description: str | None = None,
    text: str | None = None,
) -> list[str]:
    role = (role or "").lower()
    content = _normalize(text)
    source = _source_text(filename, description, content)
    lowered = source.lower()
    document_hint = _source_text(filename, description).lower()
    values: dict[str, object] = {}

    if role in {"dpo", "legal"}:
        gdpr_applicable = _parse_bool(
            source,
            (
                "gdpr applies",
                "gdpr is applicable",
                "gdpr applicable: yes",
                "gdpr_applicable: true",
            ),
            (
                "gdpr does not apply",
                "gdpr is not applicable",
                "gdpr applicable: no",
                "gdpr_applicable: false",
            ),
        )
        if gdpr_applicable is not None:
            values["gdpr_applicable"] = gdpr_applicable
        elif role == "dpo" and "gdpr" in lowered:
            values["gdpr_applicable"] = True

    notifiability_hint = role == "dpo" and (
        "notifiability" in document_hint
        or "notifiability assessment" in lowered
        or "notifiable" in lowered
        or "notification required" in lowered
        or "authority notification is recommended" in lowered
        or "notification to the competent supervisory authority" in lowered
    )
    if notifiability_hint:
        assessment_source = content or source
        assessment = _extract_section(
            assessment_source,
            (
                "short answer",
                "authority notification analysis",
                "dpo recommendation",
                "dpo conclusion",
                "conclusion",
            ),
        )
        if assessment or "notifiable" in lowered or "notification required" in lowered:
            values["notifiability_assessment"] = assessment or "DPO notifiability assessment submitted."

    if role == "dpo":
        count = _parse_affected_count(source)
        if count is not None:
            values["individuals_affected"] = count

        data_categories = _extract_section(
            content or source,
            (
                "data categories",
                "personal data fields",
                "personal data assessment",
                "data affected",
            ),
        )
        if data_categories:
            values["data_categories"] = data_categories

        potential_harm = _extract_section(
            content or source,
            (
                "potential harm",
                "likely consequences",
                "risk drivers",
                "risk factors",
            ),
        )
        if potential_harm:
            values["potential_harm"] = potential_harm

    if role in {"legal", "compliance"}:
        nis2_applicable = _parse_bool(
            source,
            (
                "nis2 applies",
                "nis2 is applicable",
                "nis2 applicable: yes",
                "kritis",
                "nis/",
                "dora",
            ),
            (
                "nis2 does not apply",
                "nis2 is not applicable",
                "nis2 applicable: no",
            ),
        )
        if nis2_applicable is not None:
            values["nis2_applicable"] = nis2_applicable

    risk_level = _parse_risk_level(source)
    if risk_level and (role in {"itsec", "iso"} or "forensic" in document_hint):
        values["severity"] = risk_level
    if risk_level and (
        role == "compliance"
        or "risk_classification" in document_hint
        or "risk classification" in document_hint
    ):
        values["risk_classification"] = risk_level

    return _apply_values(incident, values)


def apply_task_response_overview_update(
    incident,
    role: str,
    task_title: str | None = None,
    response: str | None = None,
) -> list[str]:
    role = (role or "").lower()
    source = _source_text(task_title, response)
    lowered = source.lower()

    if role != "ciso" and "ciso" not in lowered:
        return []

    values: dict[str, object] = {}
    if any(term in lowered for term in ("no_notify", "do not notify", "not notify", "keine meldung")):
        values["notification_decision"] = "no_notify"
    elif any(term in lowered for term in ("notify", "notification", "jo", "mach ich", "melden", "meldung")):
        values["notification_decision"] = "notify"

    if values:
        values["notification_decision_reason"] = _shorten(response or "CISO task response recorded.", 600)

    return _apply_values(incident, values)


async def sync_overview_from_artifacts(db: AsyncSession, incident) -> list[str]:
    changes: list[str] = []

    docs_result = await db.execute(
        select(Document).where(Document.incident_id == incident.id).order_by(Document.created_at)
    )
    documents = docs_result.scalars().all()

    for doc in documents:
        text = ""
        if doc.filepath and Path(doc.filepath).exists():
            try:
                from app.services.rag_service import extract_text

                text = extract_text(doc.filepath)
            except Exception:
                text = ""

        changes.extend(
            apply_document_overview_update(
                incident,
                doc.uploaded_by_role,
                filename=doc.filename,
                description=doc.description,
                text=text,
            )
        )

    tasks_result = await db.execute(
        select(Task).where(Task.incident_id == incident.id).order_by(Task.updated_at)
    )
    tasks = tasks_result.scalars().all()

    for task in tasks:
        if not task.response:
            continue
        changes.extend(
            apply_task_response_overview_update(
                incident,
                task.assigned_to_role,
                task_title=task.title,
                response=task.response,
            )
        )

    return list(dict.fromkeys(changes))
