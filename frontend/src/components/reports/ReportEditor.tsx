import { useState, useEffect } from "react";
import {
  getReport,
  saveReport,
  generateReport,
  finalizeReport,
  getReportPdfUrl,
} from "@/api/reports";
import type { Report } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Save,
  FileDown,
  Loader2,
  CheckCircle2,
  Eye,
  Pencil,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Props {
  incidentId: number;
  isISO: boolean;
}

export default function ReportEditor({ incidentId, isISO }: Props) {
  const [report, setReport] = useState<Report | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    getReport(incidentId).then((r) => {
      setReport(r);
      setContent(r?.content ?? "");
      setLoading(false);
    });
  }, [incidentId]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const r = await generateReport(incidentId);
      setReport(r);
      setContent(r.content);
      toast.success("Report generated");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const r = await saveReport(incidentId, content);
      setReport(r);
      toast.success("Report saved");
    } finally {
      setSaving(false);
    }
  }

  async function handleFinalize() {
    const r = await finalizeReport(incidentId);
    setReport(r);
    toast.success("Report finalized");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const isFinal = report?.status === "final";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Incident Report</h3>
          {report && (
            <Badge
              className={`text-xs ${isFinal ? "bg-green-600 text-white" : "bg-yellow-500 text-white"}`}
            >
              {isFinal ? (
                <>
                  <Lock className="h-3 w-3 mr-1" /> Final
                </>
              ) : (
                "Draft"
              )}
            </Badge>
          )}
        </div>

        {isISO && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerate}
              disabled={generating || isFinal}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1" />
              )}
              AI Generate
            </Button>

            {report && !isFinal && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPreview(!preview)}
                >
                  {preview ? (
                    <Pencil className="h-4 w-4 mr-1" />
                  ) : (
                    <Eye className="h-4 w-4 mr-1" />
                  )}
                  {preview ? "Edit" : "Preview"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  Save
                </Button>
                <Button
                  size="sm"
                  onClick={handleFinalize}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Finalize
                </Button>
              </>
            )}

            {report && (
              <a
                href={getReportPdfUrl(incidentId)}
                target="_blank"
                rel="noreferrer"
              >
                <Button size="sm" variant="outline">
                  <FileDown className="h-4 w-4 mr-1" /> PDF
                </Button>
              </a>
            )}
          </div>
        )}
      </div>

      {!report ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No report yet. Click "AI Generate" to create one from incident data.
          </CardContent>
        </Card>
      ) : preview || isFinal || !isISO ? (
        <Card>
          <CardContent className="p-6 prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{content}</ReactMarkdown>
          </CardContent>
        </Card>
      ) : (
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={25}
          className="font-mono text-sm"
        />
      )}
    </div>
  );
}
