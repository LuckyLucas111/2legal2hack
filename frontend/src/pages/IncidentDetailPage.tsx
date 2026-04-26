import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRole } from "@/context/RoleContext";
import { getIncident } from "@/api/incidents";
import { getIncidentTasks, createTask, updateTask } from "@/api/tasks";
import {
  getSuggestions,
  generateSuggestions,
  updateSuggestion,
} from "@/api/suggestions";
import type { SuggestionUpdatePayload } from "@/api/suggestions";
import { getTimeline } from "@/api/dashboard";
import { getDocuments } from "@/api/documents";
import type { DocumentInfo } from "@/api/documents";
import type { Incident, Task, TimelineEvent, Role, Suggestion } from "@/types";
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
import ReportEditor from "@/components/reports/ReportEditor";
import {
  Clock,
  CheckCircle2,
  Send,
  Plus,
  MessageSquare,
  Paperclip,
  FileText,
  Download,
  X,
  AlertTriangle,
  AlertCircle,
  ClipboardList,
  Bell,
  HelpCircle,
  Search,
  Circle,
  Sparkles,
  Loader2,
  Check,
  Cpu,
  Lightbulb,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const severityConfig: Record<string, { class: string }> = {
  critical: { class: "bg-red-600 text-white border-transparent" },
  high: { class: "bg-orange-500 text-white border-transparent" },
  medium: { class: "bg-yellow-500 text-white border-transparent" },
  low: { class: "bg-green-600 text-white border-transparent" },
};

const priorityConfig: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300",
  high: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300",
  low: "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300",
};

const taskTypeIcon: Record<string, React.ElementType> = {
  assessment: ClipboardList,
  report: FileText,
  notification: Bell,
  info_request: HelpCircle,
  review: Search,
  general: Circle,
};

const eventTypeColors: Record<string, string> = {
  task_created: "bg-blue-500",
  task_updated: "bg-green-500",
  suggestions_generated: "bg-purple-500",
  suggestion_updated: "bg-purple-400",
  document_uploaded: "bg-amber-500",
  document_deleted: "bg-amber-400",
  incident_created: "bg-red-500",
};

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { role } = useRole();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [activeTab, setActiveTab] = useState<
    "overview" | "tasks" | "timeline" | "kb" | "report"
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

  const pendingTaskCount = tasks.filter((t) => t.status === "pending").length;

  const sevCfg = incident.severity ? severityConfig[incident.severity.toLowerCase()] : null;

  const tabLabels: Record<string, string> = {
    overview: "Overview",
    tasks: "Tasks",
    timeline: "Timeline",
    kb: "Knowledge Base",
    report: "Report",
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {incident.title}
            </h1>
            {incident.severity && (
              <Badge className={sevCfg?.class ?? "bg-gray-500 text-white"}>
                <AlertTriangle className="h-3 w-3 mr-1" />
                {incident.severity.toUpperCase()}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-muted-foreground">
              Created{" "}
              {format(new Date(incident.created_at), "MMM d, yyyy HH:mm")}
            </span>
          </div>
        </div>
      </div>

      {(incident.gdpr_deadline || incident.nis2_early_warning_deadline || incident.nis2_report_deadline) && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">Regulatory Deadlines</span>
            </div>
            <div className="flex gap-6 flex-wrap">
              {incident.gdpr_deadline && (
                <CountdownTimer label="GDPR 72h" deadline={incident.gdpr_deadline} maxHours={72} />
              )}
              {incident.nis2_early_warning_deadline && (
                <CountdownTimer label="NIS2 24h" deadline={incident.nis2_early_warning_deadline} maxHours={24} />
              )}
              {incident.nis2_report_deadline && (
                <CountdownTimer label="NIS2 72h" deadline={incident.nis2_report_deadline} maxHours={72} />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex border-b">
        {(["overview", "tasks", "timeline", "kb", "report"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === tab
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tabLabels[tab]}
            {tab === "tasks" && tasks.length > 0 && (
              <span className="text-xs text-muted-foreground">({tasks.length})</span>
            )}
            {tab === "tasks" && pendingTaskCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] rounded-full h-4 min-w-4 px-1 inline-flex items-center justify-center">
                {pendingTaskCount}
              </span>
            )}
            {tab === "kb" && documents.length > 0 && (
              <span className="text-xs text-muted-foreground">({documents.length})</span>
            )}
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
      {activeTab === "report" && (
        <ReportEditor incidentId={incident.id} isISO={role === "iso"} />
      )}
    </div>
  );
}

function AssessmentRow({
  label,
  value,
  pending = false,
}: {
  label: string;
  value: string;
  pending?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <div className="flex items-center gap-1.5">
        {pending ? (
          <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
        )}
        <span className={`text-sm font-medium ${pending ? "text-amber-600 dark:text-amber-400" : ""}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

function OverviewTab({ incident }: { incident: Incident }) {
  const gdprVal =
    incident.gdpr_applicable === null
      ? "Pending"
      : incident.gdpr_applicable
        ? "Yes"
        : "No";
  const nis2Val =
    incident.nis2_applicable === null
      ? "Pending"
      : incident.nis2_applicable
        ? "Yes"
        : "No";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{incident.description}</p>
          {(incident.data_categories || incident.individuals_affected || incident.potential_harm) && (
            <div className="mt-4 pt-4 border-t space-y-2">
              {incident.data_categories && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Data categories: </span>
                  <span className="font-medium">{Array.isArray(incident.data_categories) ? incident.data_categories.join(", ") : incident.data_categories}</span>
                </div>
              )}
              {incident.individuals_affected && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Individuals affected: </span>
                  <span className="font-medium">{incident.individuals_affected}</span>
                </div>
              )}
              {incident.potential_harm && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Potential harm: </span>
                  <span className="font-medium">{incident.potential_harm}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Regulatory Applicability</CardTitle>
          </CardHeader>
          <CardContent>
            <AssessmentRow label="GDPR Applicable" value={gdprVal} pending={incident.gdpr_applicable === null} />
            <AssessmentRow label="NIS2 Applicable" value={nis2Val} pending={incident.nis2_applicable === null} />
            <AssessmentRow
              label="Notifiability"
              value={incident.notifiability_assessment ?? "Pending"}
              pending={!incident.notifiability_assessment}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Risk & Notification</CardTitle>
          </CardHeader>
          <CardContent>
            <AssessmentRow
              label="Risk Classification"
              value={incident.risk_classification ?? "Pending"}
              pending={!incident.risk_classification}
            />
            <AssessmentRow
              label="Notification Decision"
              value={incident.notification_decision ?? "Pending"}
              pending={!incident.notification_decision}
            />
            {incident.notification_decision_reason && (
              <div className="mt-2 p-2 bg-muted rounded text-sm">
                <span className="text-muted-foreground">Reason: </span>
                {incident.notification_decision_reason}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
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
  const [showInfoRequest, setShowInfoRequest] = useState(false);
  const [infoTarget, setInfoTarget] = useState<"sysadmin" | "itsec">("sysadmin");
  const [infoText, setInfoText] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newAssign, setNewAssign] = useState<Role>("dpo");
  const [newType, setNewType] = useState("general");
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [responseText, setResponseText] = useState("");
  const [responseFile, setResponseFile] = useState<File | null>(null);
  const [drafts, setDrafts] = useState<Suggestion[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [generatingDrafts, setGeneratingDrafts] = useState(false);
  const autoGeneratedForIncident = useRef<number | null>(null);

  const loadDrafts = useCallback(async (autoGenerate = false) => {
    setDraftsLoading(true);
    const shouldAttemptAutoGenerate =
      autoGenerate && autoGeneratedForIncident.current !== incident.id;
    if (shouldAttemptAutoGenerate) {
      autoGeneratedForIncident.current = incident.id;
    }

    try {
      let data = await getSuggestions(incident.id);
      let pending = data.filter((s) => s.status === "pending");

      if (
        shouldAttemptAutoGenerate &&
        data.length === 0
      ) {
        setGeneratingDrafts(true);
        try {
          await generateSuggestions(incident.id);
          data = await getSuggestions(incident.id);
          pending = data.filter((s) => s.status === "pending");
        } finally {
          setGeneratingDrafts(false);
        }
      }

      setDrafts(pending);
    } finally {
      setDraftsLoading(false);
    }
  }, [incident.id]);

  useEffect(() => {
    if (role === "iso") {
      loadDrafts(true);
    } else {
      setDrafts([]);
      setDraftsLoading(false);
    }
  }, [loadDrafts, role]);

  async function handleInfoRequest(e: React.FormEvent) {
    e.preventDefault();
    await createTask(incident.id, {
      title: `Information Request: ${infoText.slice(0, 60)}`,
      description: infoText,
      assigned_to_role: infoTarget,
      task_type: "info_request",
    });
    toast.success(`Info request sent to ${ROLE_CONFIG[infoTarget].label}`);
    setShowInfoRequest(false);
    setInfoText("");
    onReload();
  }

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

  async function handleDraftAction(
    suggestionId: number,
    payload: SuggestionUpdatePayload
  ) {
    await updateSuggestion(incident.id, suggestionId, payload);
    if (payload.status === "dispatched") {
      toast.success("Task signed off and dispatched");
      onReload();
    } else {
      toast.success("Task draft dismissed");
    }
    await loadDrafts(false);
  }

  async function handleRespond(taskId: number) {
    await updateTask(
      incident.id,
      taskId,
      { response: responseText, status: "completed" },
      responseFile ?? undefined
    );
    toast.success("Response submitted");
    setRespondingId(null);
    setResponseText("");
    setResponseFile(null);
    onReload();
  }

  const roles = Object.keys(ROLE_CONFIG) as Role[];

  return (
    <div className="space-y-4">
      {(role === "iso" || role === "ciso") && (
        <div className="flex justify-end gap-2">
          {role === "iso" && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowInfoRequest(!showInfoRequest);
                  setShowCreate(false);
                }}
              >
                <MessageSquare className="h-4 w-4 mr-1" /> Request Information
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  setGeneratingDrafts(true);
                  try {
                    const created = await generateSuggestions(incident.id);
                    if (created.length > 0) {
                      toast.success("Task drafts generated");
                    } else {
                      toast.info("No new task drafts available");
                    }
                    await loadDrafts(false);
                  } finally {
                    setGeneratingDrafts(false);
                  }
                }}
                disabled={generatingDrafts || draftsLoading}
              >
                {generatingDrafts ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1" />
                )}
                Generate Task Drafts
              </Button>
            </>
          )}
          <Button
            size="sm"
            onClick={() => {
              setShowCreate(!showCreate);
              setShowInfoRequest(false);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Dispatch Task
          </Button>
        </div>
      )}

      {showInfoRequest && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleInfoRequest} className="space-y-3">
              <Select
                value={infoTarget}
                onChange={(e) =>
                  setInfoTarget(e.target.value as "sysadmin" | "itsec")
                }
              >
                <option value="sysadmin">SysAdmin</option>
                <option value="itsec">IT-Sec</option>
              </Select>
              <Textarea
                value={infoText}
                onChange={(e) => setInfoText(e.target.value)}
                placeholder="What information do you need?"
                rows={3}
                required
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm">
                  Send Request
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInfoRequest(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
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

      {role === "iso" && (draftsLoading || generatingDrafts || drafts.length > 0) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <h3 className="text-sm font-medium">Task Drafts</h3>
            {drafts.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {drafts.length}
              </Badge>
            )}
          </div>
          {draftsLoading || generatingDrafts ? (
            <Card>
              <CardContent className="p-4 flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {generatingDrafts ? "Generating task drafts..." : "Loading drafts..."}
              </CardContent>
            </Card>
          ) : (
            drafts.map((draft) => (
              <TaskDraftCard
                key={draft.id}
                draft={draft}
                onAction={handleDraftAction}
              />
            ))
          )}
        </div>
      )}

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No tasks yet.
          </CardContent>
        </Card>
      ) : (
        tasks.map((task) => {
          const TypeIcon = taskTypeIcon[task.task_type] ?? Circle;
          const roleColor = ROLE_CONFIG[task.assigned_to_role]?.color ?? "bg-gray-500";

          return (
            <Card
              key={task.id}
              className={
                task.status === "pending"
                  ? "border-l-4 border-l-amber-400"
                  : task.status === "completed"
                    ? "border-l-4 border-l-green-500"
                    : task.status === "in_progress"
                      ? "border-l-4 border-l-blue-500"
                      : ""
              }
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <TypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
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
                      {task.priority && task.priority !== "medium" && (
                        <Badge className={`text-xs border ${priorityConfig[task.priority] ?? ""}`}>
                          {task.priority}
                        </Badge>
                      )}
                    </div>
                    {task.description && (
                      <div className="text-sm text-muted-foreground mb-2 prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{task.description}</ReactMarkdown>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={`inline-block h-2 w-2 rounded-full ${roleColor}`} />
                      <span>
                        Assigned to{" "}
                        <span className="font-medium">
                          {ROLE_CONFIG[task.assigned_to_role]?.label ??
                            task.assigned_to_role}
                        </span>{" "}
                        by{" "}
                        {ROLE_CONFIG[task.created_by_role]?.label ??
                          task.created_by_role}
                      </span>
                      <span className="text-muted-foreground/50">
                        {format(new Date(task.created_at), "MMM d, HH:mm")}
                      </span>
                    </div>
                    {task.response && (
                      <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md">
                        <div className="flex items-center gap-1 mb-1">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          <span className="text-xs font-medium text-green-700 dark:text-green-400">Response</span>
                        </div>
                        <div className="text-sm prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{task.response}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                    {task.response_document && (
                      <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">
                            {task.response_document.filename}
                          </span>
                          <a
                            href={`/api/v1/incidents/${incident.id}/documents/${task.response_document_id}/download`}
                            className="ml-auto"
                          >
                            <Button size="sm" variant="ghost">
                              <Download className="h-3 w-3 mr-1" /> Download
                            </Button>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
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
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <Paperclip className="h-4 w-4" />
                        <span>{responseFile ? responseFile.name : "Attach file"}</span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.docx,.doc,.txt,.md,.csv"
                          onChange={(e) =>
                            setResponseFile(e.target.files?.[0] ?? null)
                          }
                        />
                      </label>
                      {responseFile && (
                        <button
                          type="button"
                          onClick={() => setResponseFile(null)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleRespond(task.id)}
                        disabled={!responseText.trim() && !responseFile}
                      >
                        Submit & Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRespondingId(null);
                          setResponseFile(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

function TaskDraftCard({
  draft,
  onAction,
}: {
  draft: Suggestion;
  onAction: (id: number, payload: SuggestionUpdatePayload) => void;
}) {
  const SourceIcon = draft.suggestion_type === "ai_generated" ? Cpu : Lightbulb;
  const [title, setTitle] = useState(draft.title);
  const [description, setDescription] = useState(draft.description);
  const [targetRole, setTargetRole] = useState<Role>(
    (draft.target_role as Role | null) ?? "dpo"
  );
  const [taskType, setTaskType] = useState(draft.task_type ?? "general");
  const roleColor = targetRole
    ? ROLE_CONFIG[targetRole]?.color ?? "bg-gray-500"
    : "bg-gray-500";
  const roles = Object.keys(ROLE_CONFIG) as Role[];

  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <SourceIcon className="h-4 w-4 text-purple-500 shrink-0" />
              <Badge variant="outline" className="text-xs">
                draft
              </Badge>
              {draft.priority && (
                <Badge className={`text-xs border ${priorityConfig[draft.priority] ?? ""}`}>
                  {draft.priority}
                </Badge>
              )}
            </div>
            <div className="space-y-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                required
              />
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={3}
              />
              <div className="flex gap-3">
                <Select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as Role)}
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_CONFIG[r].label}
                    </option>
                  ))}
                </Select>
                <Select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                >
                  <option value="general">General</option>
                  <option value="assessment">Assessment</option>
                  <option value="report">Report</option>
                  <option value="notification">Notification</option>
                  <option value="info_request">Info Request</option>
                  <option value="review">Review</option>
                </Select>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={`inline-block h-2 w-2 rounded-full ${roleColor}`} />
                <span>
                  Drafted for{" "}
                  <span className="font-medium">
                    {ROLE_CONFIG[targetRole]?.label ?? targetRole}
                  </span>
                </span>
                <span className="text-muted-foreground/50">
                  {format(new Date(draft.created_at), "MMM d, HH:mm")}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button
              size="sm"
              onClick={() =>
                onAction(draft.id, {
                  status: "dispatched",
                  title: title.trim(),
                  description,
                  target_role: targetRole,
                  task_type: taskType,
                  priority: draft.priority ?? "medium",
                })
              }
              disabled={!title.trim()}
            >
              <Check className="h-3 w-3 mr-1" />
              Sign Off
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction(draft.id, { status: "dismissed" })}
            >
              <X className="h-3 w-3 mr-1" />
              Dismiss
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TimelineTab({ timeline }: { timeline: TimelineEvent[] }) {
  return (
    <div className="space-y-0">
      {timeline.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No events yet.
          </CardContent>
        </Card>
      ) : (
        timeline.map((event) => {
          const dotColor = eventTypeColors[event.event_type] ?? "bg-gray-400";
          const roleCfg = event.role ? ROLE_CONFIG[event.role as Role] : null;

          return (
            <div key={event.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`h-3 w-3 rounded-full ${dotColor} mt-1.5 shrink-0 ring-2 ring-background`} />
                <div className="flex-1 w-px bg-border" />
              </div>
              <div className="pb-4 flex-1 min-w-0">
                <p className="text-sm font-medium">{event.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  {roleCfg && (
                    <Badge className={`text-[10px] px-1.5 py-0 ${roleCfg.color} text-white`}>
                      {roleCfg.label}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(event.created_at), "MMM d, HH:mm:ss")}
                  </span>
                </div>
              </div>
            </div>
          );
        })
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
