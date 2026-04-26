import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useRole } from "@/context/RoleContext";
import { getDashboard } from "@/api/dashboard";
import type { DashboardData } from "@/types";
import { ROLE_CONFIG } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CountdownTimer from "@/components/dashboard/CountdownTimer";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  Activity,
  ClipboardList,
  FileText,
  Bell,
  HelpCircle,
  Search,
  Circle,
} from "lucide-react";

const phaseColors: Record<string, string> = {
  draft: "bg-gray-500",
  triage: "bg-yellow-500",
  assessment: "bg-blue-500",
  decision: "bg-purple-500",
  notification: "bg-orange-500",
  closed: "bg-green-600",
};

const severityConfig: Record<string, { border: string; icon: string }> = {
  critical: { border: "border-l-red-600", icon: "text-red-600" },
  high: { border: "border-l-orange-500", icon: "text-orange-500" },
  medium: { border: "border-l-yellow-500", icon: "text-yellow-500" },
  low: { border: "border-l-green-600", icon: "text-green-600" },
};

const severityBadgeClass: Record<string, string> = {
  critical: "bg-red-600 text-white border-transparent",
  high: "bg-orange-500 text-white border-transparent",
  medium: "bg-yellow-500 text-white border-transparent",
  low: "bg-green-600 text-white border-transparent",
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

export default function DashboardPage() {
  const { role } = useRole();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!role) return;
    setLoading(true);
    getDashboard(role)
      .then(setData)
      .finally(() => setLoading(false));
  }, [role]);

  if (!role) return null;
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Clock className="h-5 w-5 animate-spin mr-2" />
        Loading...
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome, {ROLE_CONFIG[role].label}
          </p>
        </div>
        {role === "sysadmin" && (
          <Link to="/incidents/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Incident
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-transparent dark:from-red-950/20 dark:to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Active Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {data.active_incidents.length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-transparent dark:from-amber-950/20 dark:to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Your Pending Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.pending_task_count}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/20 dark:to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Recent Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.recent_events.length}</p>
          </CardContent>
        </Card>
      </div>

      {data.active_incidents.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Active Incidents</h2>
          {data.active_incidents.map((incident) => {
            const sev = severityConfig[incident.severity ?? ""] ?? null;
            return (
              <Link key={incident.id} to={`/incidents/${incident.id}`}>
                <Card
                  className={`hover:shadow-md transition-shadow mb-3 border-l-4 ${sev ? sev.border : "border-l-gray-300 dark:border-l-gray-600"}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle
                            className={`h-4 w-4 ${sev ? sev.icon : "text-orange-500"}`}
                          />
                          <span className="font-semibold">{incident.title}</span>
                          <Badge
                            className={`${phaseColors[incident.phase]} text-white text-xs`}
                          >
                            {incident.phase}
                          </Badge>
                          {incident.severity && (
                            <Badge
                              className={`text-xs ${severityBadgeClass[incident.severity] ?? ""}`}
                            >
                              {incident.severity}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {incident.description}
                        </p>
                        <div className="flex gap-6 mt-2">
                          {incident.gdpr_deadline && (
                            <CountdownTimer
                              label="GDPR 72h"
                              deadline={incident.gdpr_deadline}
                              maxHours={72}
                            />
                          )}
                          {incident.nis2_early_warning_deadline && (
                            <CountdownTimer
                              label="NIS2 24h"
                              deadline={incident.nis2_early_warning_deadline}
                              maxHours={24}
                            />
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {data.pending_tasks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Pending Tasks</h2>
          {data.pending_tasks.map((task) => {
            const TypeIcon = taskTypeIcon[task.task_type] ?? Circle;
            const statusBorder =
              task.status === "completed"
                ? "border-l-green-500"
                : task.status === "in_progress"
                  ? "border-l-blue-500"
                  : "border-l-amber-400";
            return (
              <Link key={task.id} to={`/incidents/${task.incident_id}`}>
                <Card
                  className={`hover:shadow-md transition-shadow mb-3 border-l-4 ${statusBorder}`}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <TypeIcon className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            Incident #{task.incident_id}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {task.task_type}
                          </Badge>
                          {task.priority && (
                            <Badge
                              className={`text-xs border ${priorityConfig[task.priority] ?? ""}`}
                            >
                              {task.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.status === "completed" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                      <Badge variant="outline">{task.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {data.active_incidents.length === 0 && data.pending_tasks.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p className="text-lg font-medium">All clear!</p>
            <p>No active incidents or pending tasks.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
