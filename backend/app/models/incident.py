from datetime import datetime, timedelta
from sqlalchemy import Integer, String, Text, Boolean, DateTime, event
from sqlalchemy.orm import Mapped, mapped_column, relationship
from dateutil.relativedelta import relativedelta

from app.database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    phase: Mapped[str] = mapped_column(String(50), default="draft")
    severity: Mapped[str | None] = mapped_column(String(50), nullable=True)

    gdpr_applicable: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    nis2_applicable: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    notifiability_assessment: Mapped[str | None] = mapped_column(Text, nullable=True)
    risk_classification: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notification_decision: Mapped[str | None] = mapped_column(String(50), nullable=True)
    notification_decision_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    data_categories: Mapped[str | None] = mapped_column(Text, nullable=True)
    individuals_affected: Mapped[int | None] = mapped_column(Integer, nullable=True)
    potential_harm: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_by_role: Mapped[str] = mapped_column(String(50), default="sysadmin")

    detected_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    gdpr_deadline: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    nis2_early_warning_deadline: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    nis2_report_deadline: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    nis2_final_report_deadline: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tasks = relationship("Task", back_populates="incident", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="incident", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="incident", cascade="all, delete-orphan")
    kb_conversations = relationship("KBConversation", back_populates="incident", cascade="all, delete-orphan")
    suggestions = relationship("Suggestion", back_populates="incident", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="incident", cascade="all, delete-orphan")

    def compute_deadlines(self):
        if self.detected_at:
            self.gdpr_deadline = self.detected_at + timedelta(hours=72)
            self.nis2_early_warning_deadline = self.detected_at + timedelta(hours=24)
            self.nis2_report_deadline = self.detected_at + timedelta(hours=72)
            self.nis2_final_report_deadline = self.detected_at + relativedelta(months=1)


@event.listens_for(Incident, "before_insert")
def set_deadlines(mapper, connection, target):
    target.compute_deadlines()
