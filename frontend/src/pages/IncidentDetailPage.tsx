import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useRole } from "@/context/RoleContext";
import { getIncident, updatePhase } from "@/api/incidents";
import { getIncidentTasks, createTask, updateTask } from "@/api/tasks";
import { getTimeline } from "@/api/dashboard";
import { getDocuments } from "@/api/documents";
import type { DocumentInfo } from "@/api/documents";
import type { Incident, Task, TimelineEvent, Role } from "@/types";
import { ROLE_CONFIG } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import CountdownTimer from "@/components/dashboard/CountdownTimer";
import DocumentUpload from "@/components/kb/DocumentUpload";
import DocumentList from "@/components/kb/DocumentList";
import KBChatInterface from "@/components/kb/KBChatInterface";
import SuggestionList from "@/components/suggestions/SuggestionList";
import ReportEditor from "@/components/reports/ReportEditor";
import {
  Clock,
  CheckCircle2,
  Send,
  Plus,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const PHASES = [
  "draft",
  "triage",
  "assessment",
  "decision",
  "notification",
  "closed",
] as const;

const phaseColors: Record<string, string> = {
  draft: "bg-gray-500",
  triage: "bg-yellow-500",
  assessment: "bg-blue-500",
  decision: "bg-purple-500",
  notification: "bg-orange-500",
  closed: "bg-green-600",
};

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { role } = useRole();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [activeTab, setActiveTab] = useState<
    "overview" | "tasks" | "timeline" | "kb" | "suggestions" | "report"
  >("overview");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!id) return;
    const numId = parseInt(id, 10);
    const [inc, t, tl, docs] = await Promise.all([
      getIncident(numId),
      getIncidentTasks(numId),
      getTimeline(numId),
      getDocuments(numId),
    ]);
    setIncident(inc);
    setTasks(t);
    setTimeline(tl);
    setDocuments(docs);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (loading || !incident || !role)
    return (
      <div className="p-8 flex items-center">
        <Clock className="h-5 w-5 animate-spin mr-2" /> Loading...
      </div>
    );

  const currentPhaseIdx = PHASES.indexOf(incident.phase as (typeof PHASES)[number]);
  const nextPhase = currentPhaseIdx < PHASES.length - 1 ? PHASES[currentPhaseIdx + 1] : null;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {incident.title}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              className={`${phaseColors[incident.phase]} text-white`}
            >
              {incident.phase}
            </Badge>
            {incident.severity && (
              <Badge variant="outline">{incident.severity}</Badge>
            )}
            <span className="text-sm text-muted-foreground">
              Created{" "}
              {format(new Date(incident.created_at), "MMM d, yyyy HH:mm")}
            </span>
          </div>
        </div>
        {role === "iso" && nextPhase && (
          <Button
            onClick={async () => {
              await updatePhase(incident.id, nextPhase);
              toast.success(`Phase advanced to ${nextPhase}`);
              reload();
            }}
          >
            Advance to {nextPhase}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      <div className="flex gap-4">
        {incident.gdpr_deadline && (
          <CountdownTimer label="GDPR 72h" deadline={incident.gdpr_deadline} />
        )}
        {incident.nis2_early_warning_deadline && (
          <CountdownTimer
            label="NIS2 24h"
            deadline={incident.nis2_early_warning_deadline}
          />
        )}
        {incident.nis2_report_deadline && (
          <CountdownTimer
            label="NIS2 72h"
            deadline={incident.nis2_report_deadline}
          />
        )}
      </div>

      {/* Phase bar */}
      <div className="flex gap-1">
        {PHASES.map((phase, idx) => (
          <div
            key={phase}
            className={`flex-1 h-2 rounded-full ${
              idx <= currentPhaseIdx ? phaseColors[phase] : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {(["overview", "tasks", "timeline", "kb", "suggestions", "report"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === tab
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "kb" ? "Knowledge Base" : tab === "suggestions" ? "Suggestions" : tab === "report" ? "Report" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === "tasks" && ` (${tasks.length})`}
            {tab === "kb" && ` (${documents.length})`}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <OverviewTab incident={incident} />
      )}
      {activeTab === "tasks" && (
        <TasksTab
          incident={incident}
          tasks={tasks}
          role={role}
          onReload={reload}
        />
      )}
      {activeTab === "timeline" && <TimelineTab timeline={timeline} />}
      {activeTab === "kb" && (
        <KnowledgeBaseTab
          incidentId={incident.id}
          documents={documents}
          onReload={reload}
        />
      )}
      {activeTab === "suggestions" && (
        <SuggestionList
          incidentId={incident.id}
          role={role}
          onReload={reload}
        />
      )}
      {activeTab === "report" && (
        <ReportEditor incidentId={incident.id} isISO={role === "iso"} />
      )}
    </div>
  );
}

function OverviewTab({ incident }: { incident: Incident }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{incident.description}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Assessments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <span className="text-muted-foreground">GDPR Applicable: </span>
            <span className="font-medium">
              {incident.gdpr_applicable === null
                ? "Pending"
                : incident.gdpr_applicable
                  ? "Yes"
                  : "No"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">NIS2 Applicable: </span>
            <span className="font-medium">
              {incident.nis2_applicable === null
                ? "Pending"
                : incident.nis2_applicable
                  ? "Yes"
                  : "No"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Notifiability: </span>
            <span className="font-medium">
              {incident.notifiability_assessment ?? "Pending"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Risk Classification: </span>
            <span className="font-medium">
              {incident.risk_classification ?? "Pending"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Notification Decision: </span>
            <span className="font-medium">
              {incident.notification_decision ?? "Pending"}
            </span>
          </div>
          {incident.notification_decision_reason && (
            <div>
              <span className="text-muted-foreground">Decision Reason: </span>
              <span className="font-medium">
                {incident.notification_decision_reason}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TasksTab({
  incident,
  tasks,
  role,
  onReload,
}: {
  incident: Incident;
  tasks: Task[];
  role: Role;
  onReload: () => void;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newAssign, setNewAssign] = useState<Role>("dpo");
  const [newType, setNewType] = useState("general");
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [responseText, setResponseText] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createTask(incident.id, {
      title: newTitle,
      description: newDesc || undefined,
      assigned_to_role: newAssign,
      task_type: newType,
    });
    toast.success(`Task dispatched to ${ROLE_CONFIG[newAssign].label}`);
    setShowCreate(false);
    setNewTitle("");
    setNewDesc("");
    onReload();
  }

  async function handleRespond(taskId: number) {
    await updateTask(incident.id, taskId, {
      response: responseText,
      status: "completed",
    });
    toast.success("Response submitted");
    setRespondingId(null);
    setResponseText("");
    onReload();
  }

  const roles = Object.keys(ROLE_CONFIG) as Role[];

  return (
    <div className="space-y-4">
      {(role === "iso" || role === "ciso") && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
            <Plus className="h-4 w-4 mr-1" /> Dispatch Task
          </Button>
        </div>
      )}

      {showCreate && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleCreate} className="space-y-3">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Task title"
                required
              />
              <Textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
              />
              <div className="flex gap-3">
                <Select
                  value={newAssign}
                  onChange={(e) => setNewAssign(e.target.value as Role)}
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_CONFIG[r].label}
                    </option>
                  ))}
                </Select>
                <Select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                >
                  <option value="general">General</option>
                  <option value="assessment">Assessment</option>
                  <option value="report">Report</option>
                  <option value="notification">Notification</option>
                  <option value="info_request">Info Request</option>
                  <option value="review">Review</option>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm">
                  Create
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No tasks yet.
          </CardContent>
        </Card>
      ) : (
        tasks.map((task) => (
          <Card key={task.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{task.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {task.task_type}
                    </Badge>
                    <Badge
                      className={`text-xs ${
                        task.status === "completed"
                          ? "bg-green-600 text-white"
                          : task.status === "in_progress"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-500 text-white"
                      }`}
                    >
                      {task.status}
                    </Badge>
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {task.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Assigned to{" "}
                    <span className="font-medium">
                      {ROLE_CONFIG[task.assigned_to_role]?.label ??
                        task.assigned_to_role}
                    </span>{" "}
                    by{" "}
                    {ROLE_CONFIG[task.created_by_role]?.label ??
                      task.created_by_role}
                  </p>
                  {task.response && (
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <div className="flex items-center gap-1 mb-1">
                        <MessageSquare className="h-3 w-3" />
                        <span className="text-xs font-medium">Response</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {task.response}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {task.status === "completed" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    task.assigned_to_role === role &&
                    task.status !== "cancelled" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setRespondingId(
                            respondingId === task.id ? null : task.id
                          )
                        }
                      >
                        <Send className="h-3 w-3 mr-1" /> Respond
                      </Button>
                    )
                  )}
                </div>
              </div>
              {respondingId === task.id && (
                <div className="mt-3 space-y-2">
                  <Textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Your response..."
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleRespond(task.id)}
                      disabled={!responseText.trim()}
                    >
                      Submit & Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRespondingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function TimelineTab({ timeline }: { timeline: TimelineEvent[] }) {
  return (
    <div className="space-y-3">
      {timeline.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No events yet.
          </CardContent>
        </Card>
      ) : (
        timeline.map((event) => (
          <div key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="h-2 w-2 rounded-full bg-primary mt-2" />
              <div className="flex-1 w-px bg-border" />
            </div>
            <div className="pb-4">
              <p className="text-sm">{event.description}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {event.role && (
                  <span className="font-medium">{event.role}</span>
                )}
                {event.role && " · "}
                {format(new Date(event.created_at), "MMM d, HH:mm:ss")}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function KnowledgeBaseTab({
  incidentId,
  documents,
  onReload,
}: {
  incidentId: number;
  documents: DocumentInfo[];
  onReload: () => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ask the Knowledge Base</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <KBChatInterface incidentId={incidentId} />
          </CardContent>
        </Card>
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Upload Document</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentUpload incidentId={incidentId} onUploaded={onReload} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Documents ({documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentList
              incidentId={incidentId}
              documents={documents}
              onDeleted={onReload}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
