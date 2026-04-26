import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createIncident } from "@/api/incidents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { AlertTriangle, ShieldAlert } from "lucide-react";

const severityHelp: Record<string, { text: string; class: string; show: boolean }> = {
  critical: {
    text: "Critical: Immediate response required. All regulatory deadlines will begin counting down upon creation.",
    class: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300",
    show: true,
  },
  high: {
    text: "High: Significant impact expected. Response teams will be alerted immediately.",
    class: "bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-300",
    show: true,
  },
  medium: {
    text: "",
    class: "",
    show: false,
  },
  low: {
    text: "",
    class: "",
    show: false,
  },
};

export default function IncidentCreatePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [submitting, setSubmitting] = useState(false);

  const sevInfo = severityHelp[severity];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      const incident = await createIncident({ title, description, severity });
      toast.success("Incident created");
      navigate(`/incidents/${incident.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <ShieldAlert className="h-7 w-7 text-red-500" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Report New Incident
          </h1>
          <p className="text-sm text-muted-foreground">
            Create a new security incident to begin the response workflow.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Incident Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-1 block">Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief incident title"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                A short, descriptive name for the incident (e.g. "Unauthorized access to customer database")
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Description *
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened, what systems are affected, and any immediate observations..."
                rows={6}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Include affected systems, discovery method, and any initial containment steps taken.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Severity
              </label>
              <Select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Determines urgency and notification priority for response teams.
              </p>
              {sevInfo?.show && (
                <div className={`mt-2 flex items-start gap-2 rounded-md border p-3 text-sm ${sevInfo.class}`}>
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{sevInfo.text}</span>
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Incident"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
