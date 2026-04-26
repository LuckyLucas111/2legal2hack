import api from "./client";

export interface KBResponse {
  response: string;
  sources: { doc_id: number; filename: string }[];
}

export interface KBHistoryItem {
  id: number;
  role: string;
  query: string;
  response: string;
  sources: { doc_id: number; filename: string }[] | null;
  created_at: string;
}

export async function queryKB(
  incidentId: number,
  query: string
): Promise<KBResponse> {
  const { data } = await api.post(`/incidents/${incidentId}/kb/query`, {
    query,
  });
  return data;
}

export async function getKBHistory(
  incidentId: number
): Promise<KBHistoryItem[]> {
  const { data } = await api.get(`/incidents/${incidentId}/kb/history`);
  return data;
}
