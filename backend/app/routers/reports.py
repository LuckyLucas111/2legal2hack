from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Report, Incident
from app.schemas.report import ReportCreate, ReportResponse
from app.services.report_service import generate_report_content, generate_pdf
from app.services.timeline_service import log_event

router = APIRouter(
    prefix="/api/v1/incidents/{incident_id}/report", tags=["reports"]
)


@router.get("/", response_model=ReportResponse | None)
async def get_report(
    incident_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Report)
        .where(Report.incident_id == incident_id)
        .order_by(Report.updated_at.desc())
    )
    report = result.scalars().first()
    return report


@router.post("/", response_model=ReportResponse)
async def create_or_update_report(
    incident_id: int,
    data: ReportCreate,
    x_role: str = Header(default="iso"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Report).where(Report.incident_id == incident_id)
    )
    report = result.scalars().first()

    if report:
        report.content = data.content
        report.generated_by = x_role
    else:
        report = Report(
            incident_id=incident_id,
            content=data.content,
            generated_by=x_role,
        )
        db.add(report)

    await log_event(db, incident_id, "report_updated", "Report content updated", x_role)
    await db.commit()
    await db.refresh(report)
    return report


@router.post("/generate", response_model=ReportResponse)
async def ai_generate_report(
    incident_id: int,
    x_role: str = Header(default="iso"),
    db: AsyncSession = Depends(get_db),
):
    incident = await db.get(Incident, incident_id)
    if not incident:
        raise HTTPException(404, "Incident not found")

    content = await generate_report_content(db, incident_id)

    result = await db.execute(
        select(Report).where(Report.incident_id == incident_id)
    )
    report = result.scalars().first()

    if report:
        report.content = content
        report.generated_by = x_role
    else:
        report = Report(
            incident_id=incident_id,
            content=content,
            generated_by=x_role,
        )
        db.add(report)

    await log_event(
        db, incident_id, "report_generated", "AI-generated incident report created", x_role
    )
    await db.commit()
    await db.refresh(report)
    return report


@router.post("/finalize", response_model=ReportResponse)
async def finalize_report(
    incident_id: int,
    x_role: str = Header(default="iso"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Report).where(Report.incident_id == incident_id)
    )
    report = result.scalars().first()
    if not report:
        raise HTTPException(404, "No report found. Generate one first.")

    report.status = "final"
    await log_event(db, incident_id, "report_finalized", "Report marked as final", x_role)
    await db.commit()
    await db.refresh(report)
    return report


@router.get("/pdf")
async def export_pdf(
    incident_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Report).where(Report.incident_id == incident_id)
    )
    report = result.scalars().first()
    if not report:
        raise HTTPException(404, "No report found")

    incident = await db.get(Incident, incident_id)
    title = incident.title if incident else f"Incident {incident_id}"

    filepath = generate_pdf(report.content, title, incident_id)
    report.pdf_path = filepath
    await db.commit()

    return FileResponse(
        filepath,
        media_type="application/pdf",
        filename=f"incident_{incident_id}_report.pdf",
    )
