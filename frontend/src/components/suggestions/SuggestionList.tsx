import { useState, useEffect } from "react";
import {
  getSuggestions,
  generateSuggestions,
  updateSuggestion,
} from "@/api/suggestions";
import type { Suggestion, Role } from "@/types";
import { ROLE_CONFIG } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  Check,
  X,
  Send,
  Lightbulb,
  Cpu,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
  ClipboardList,
  FileText,
  Bell,
  HelpCircle,
  Search,
  LayoutList,
} from "lucide-react";

const priorityConfig: Record<
  string,
  { label: string; color: string; icon: typeof ArrowUp }
> = {
  critical: { label: "Critical", color: "bg-red-600 text-white", icon: AlertTriangle },
  high: { label: "High", color: "bg-orange-500 text-white", icon: ArrowUp },
  medium: { label: "Medium", color: "bg-yellow-500 text-white", icon: Minus },
  low: { label: "Low", color: "bg-green-600 text-white", icon: ArrowDown },
};

const taskTypeConfig: Record<
  string,
  { label: string; icon: typeof ClipboardList }
> = {
  assessment: { label: "Assessment", icon: ClipboardList },
  report: { label: "Report", icon: FileText },
  notification: { label: "Notification", icon: Bell },
  info_request: { label: "Info Request", icon: HelpCircle },
  review: { label: "Review", icon: Search },
  general: { label: "General", icon: LayoutList },
};

interface Props {
  incidentId: number;
  role: Role;
  onReload: () => void;
}

export default function SuggestionList({ incidentId, role, onReload }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await getSuggestions(incidentId);
    setSuggestions(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [incidentId]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      await generateSuggestions(incidentId);
      toast.success("Suggestions generated");
      await load();
    } finally {
      setGenerating(false);
    }
  }

  async function handleAction(id: number, status: string) {
    await updateSuggestion(incidentId, id, status);
    await load();
    if (status === "dispatched") onReload();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const pending = suggestions.filter((s) => s.status === "pending");
  const acted = suggestions.filter((s) => s.status !== "pending");

  return (
    <div className="space-y-4">
      {role === "iso" && (
        <div className="flex justify-end">
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1" />
            )}
            Generate Suggestions
          </Button>
        </div>
      )}

      {pending.length === 0 && acted.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No suggestions yet. Click "Generate Suggestions" to analyze the
            incident.
          </CardContent>
        </Card>
      )}

      {pending.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Pending ({pending.length})
          </h3>
          {pending.map((s) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              isISO={role === "iso"}
              onAction={handleAction}
            />
          ))}
        </div>
      )}

      {acted.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Resolved ({acted.length})
          </h3>
          {acted.map((s) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              isISO={false}
              onAction={handleAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SuggestionCard({
  suggestion,
  isISO,
  onAction,
}: {
  suggestion: Suggestion;
  isISO: boolean;
  onAction: (id: number, status: string) => void;
}) {
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500 text-white",
    approved: "bg-green-600 text-white",
    dismissed: "bg-gray-500 text-white",
    dispatched: "bg-blue-500 text-white",
  };

  const prio = suggestion.priority
    ? priorityConfig[suggestion.priority]
    : null;
  const PrioIcon = prio?.icon;

  const taskType = suggestion.task_type
    ? taskTypeConfig[suggestion.task_type]
    : null;
  const TypeIcon = taskType?.icon;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {suggestion.suggestion_type === "ai_generated" ? (
                <Cpu className="h-4 w-4 text-purple-500 shrink-0" />
              ) : (
                <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0" />
              )}
              <span className="font-medium text-sm">{suggestion.title}</span>
              <Badge className={`text-xs ${statusColors[suggestion.status]}`}>
                {suggestion.status}
              </Badge>
              {prio && PrioIcon && (
                <Badge className={`text-xs ${prio.color}`}>
                  <PrioIcon className="h-3 w-3 mr-0.5" />
                  {prio.label}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {suggestion.description}
            </p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {suggestion.target_role && (
                <span className="text-xs text-muted-foreground">
                  Target:{" "}
                  <span className="font-medium">
                    {ROLE_CONFIG[suggestion.target_role]?.label ??
                      suggestion.target_role}
                  </span>
                </span>
              )}
              {taskType && TypeIcon && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <TypeIcon className="h-3 w-3" />
                  {taskType.label}
                </span>
              )}
            </div>
          </div>

          {isISO && suggestion.status === "pending" && (
            <div className="flex gap-1 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(suggestion.id, "dispatched")}
                title="Dispatch as task"
              >
                <Send className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(suggestion.id, "approved")}
                title="Approve"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(suggestion.id, "dismissed")}
                title="Dismiss"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
