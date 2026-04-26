export type Role =
  | "iso"
  | "ciso"
  | "dpo"
  | "legal"
  | "itsec"
  | "sysadmin"
  | "communications"
  | "compliance";

export type Phase =
  | "draft"
  | "triage"
  | "assessment"
  | "decision"
  | "notification"
  | "closed";

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type TaskType =
  | "assessment"
  | "report"
  | "notification"
  | "info_request"
  | "review"
  | "general";

export type SuggestionStatus =
  | "pending"
  | "approved"
  | "dismissed"
  | "dispatched";

export interface Incident {
  id: number;
  title: string;
  description: string;
  phase: Phase;
  severity: string | null;
  gdpr_applicable: boolean | null;
  nis2_applicable: boolean | null;
  notifiability_assessment: string | null;
  risk_classification: string | null;
  notification_decision: string | null;
  notification_decision_reason: string | null;
  data_categories: string[] | null;
  individuals_affected: string | null;
  potential_harm: string | null;
  created_by_role: string;
  detected_at: string;
  gdpr_deadline: string | null;
  nis2_early_warning_deadline: string | null;
  nis2_report_deadline: string | null;
  nis2_final_report_deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  incident_id: number;
  title: string;
  description: string | null;
  assigned_to_role: Role;
  created_by_role: Role;
  status: TaskStatus;
  priority: string;
  task_type: TaskType;
  response: string | null;
  due_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: number;
  incident_id: number;
  event_type: string;
  description: string;
  role: string | null;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
}

export interface Suggestion {
  id: number;
  incident_id: number;
  suggestion_type: string;
  title: string;
  description: string;
  recommended_action: string | null;
  target_role: Role | null;
  status: SuggestionStatus;
  created_at: string;
}

export interface Report {
  id: number;
  incident_id: number;
  content: string;
  generated_by: string;
  pdf_path: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  active_incidents: Incident[];
  pending_tasks: Task[];
  recent_events: TimelineEvent[];
  pending_task_count: number;
}

export const ROLE_CONFIG: Record<
  Role,
  { label: string; description: string; color: string; icon: string }
> = {
  iso: {
    label: "ISO",
    description: "Information Security Officer — Central Coordinator",
    color: "bg-blue-600",
    icon: "Shield",
  },
  ciso: {
    label: "CISO",
    description: "Chief Information Security Officer — Final Decisions",
    color: "bg-purple-600",
    icon: "ShieldCheck",
  },
  dpo: {
    label: "DPO",
    description: "Data Protection Officer — GDPR Assessments",
    color: "bg-green-600",
    icon: "Scale",
  },
  legal: {
    label: "Legal",
    description: "Legal Counsel — Risk Classification",
    color: "bg-amber-600",
    icon: "Gavel",
  },
  itsec: {
    label: "IT-Sec",
    description: "IT Security — Forensics & Security Reports",
    color: "bg-red-600",
    icon: "Bug",
  },
  sysadmin: {
    label: "SysAdmin",
    description: "System Administrator — Incident Creation & Tech Info",
    color: "bg-orange-600",
    icon: "Server",
  },
  communications: {
    label: "Comms",
    description: "Communications — Stakeholder Communication Strategy",
    color: "bg-cyan-600",
    icon: "Megaphone",
  },
  compliance: {
    label: "Compliance",
    description: "Compliance Officer — Regulatory Sign-off",
    color: "bg-teal-600",
    icon: "ClipboardCheck",
  },
};
