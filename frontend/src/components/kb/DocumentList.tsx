import { useState } from "react";
import type { DocumentInfo } from "@/api/documents";
import { deleteDocument } from "@/api/documents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

interface Props {
  incidentId: number;
  documents: DocumentInfo[];
  onDeleted: () => void;
}

export default function DocumentList({ incidentId, documents, onDeleted }: Props) {
  const [deleting, setDeleting] = useState<number | null>(null);

  async function handleDelete(docId: number) {
    setDeleting(docId);
    try {
      await deleteDocument(incidentId, docId);
      onDeleted();
    } finally {
      setDeleting(null);
    }
  }

  if (documents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No documents uploaded yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-3 rounded-lg border bg-card"
        >
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{doc.filename}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{doc.file_type.toUpperCase()}</span>
                <span>&middot;</span>
                <span>{doc.uploaded_by_role}</span>
                <span>&middot;</span>
                <span>{format(new Date(doc.created_at), "MMM d, HH:mm")}</span>
              </div>
              {doc.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {doc.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {doc.embedded ? (
              <Badge className="bg-green-600 text-white text-xs gap-1">
                <CheckCircle2 className="h-3 w-3" /> Embedded
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs gap-1">
                <XCircle className="h-3 w-3" /> Not embedded
              </Badge>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDelete(doc.id)}
              disabled={deleting === doc.id}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
