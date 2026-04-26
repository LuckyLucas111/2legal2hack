import { useState, useEffect, useRef } from "react";
import { queryKB, getKBHistory } from "@/api/kb";
import type { KBHistoryItem } from "@/api/kb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Loader2, FileText, Bot, User } from "lucide-react";

interface Props {
  incidentId: number;
}

export default function KBChatInterface({ incidentId }: Props) {
  const [history, setHistory] = useState<KBHistoryItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getKBHistory(incidentId).then((h) => {
      setHistory(h.reverse());
      setInitialLoad(false);
    });
  }, [incidentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q || loading) return;

    setQuery("");
    setLoading(true);

    const placeholder: KBHistoryItem = {
      id: Date.now(),
      role: "",
      query: q,
      response: "",
      sources: null,
      created_at: new Date().toISOString(),
    };
    setHistory((prev) => [...prev, placeholder]);

    try {
      const result = await queryKB(incidentId, q);
      setHistory((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...placeholder,
          response: result.response,
          sources: result.sources,
        };
        return updated;
      });
    } catch {
      setHistory((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...placeholder,
          response: "Error: Could not get a response. Make sure documents are uploaded and the API key is configured.",
          sources: null,
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  if (initialLoad) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {history.length === 0 && (
          <div className="text-center text-muted-foreground py-12 space-y-2">
            <Bot className="h-10 w-10 mx-auto opacity-50" />
            <p className="text-sm">
              Ask questions about uploaded incident documents.
            </p>
            <p className="text-xs">
              Responses are tailored to your current role.
            </p>
          </div>
        )}

        {history.map((item) => (
          <div key={item.id} className="space-y-3">
            <div className="flex gap-3 justify-end">
              <div className="max-w-[80%] rounded-lg bg-primary text-primary-foreground p-3">
                <p className="text-sm">{item.query}</p>
              </div>
              <User className="h-6 w-6 shrink-0 mt-1 text-muted-foreground" />
            </div>

            {item.response ? (
              <div className="flex gap-3">
                <Bot className="h-6 w-6 shrink-0 mt-1 text-primary" />
                <Card className="max-w-[80%]">
                  <CardContent className="p-3 space-y-2">
                    <p className="text-sm whitespace-pre-wrap">{item.response}</p>
                    {item.sources && item.sources.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1 border-t">
                        {item.sources.map((s, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded"
                          >
                            <FileText className="h-3 w-3" />
                            {s.filename}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex gap-3">
                <Bot className="h-6 w-6 shrink-0 mt-1 text-primary" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about incident documents..."
          disabled={loading}
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
