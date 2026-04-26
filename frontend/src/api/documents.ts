import api from "./client";

export interface DocumentInfo {
  id: number;
  incident_id: number;
  filename: string;
  filepath: string;
  file_type: string;
  uploaded_by_role: string;
  description: string | null;
  embedded: boolean;
  created_at: string;
}

export async function getDocuments(incidentId: number): Promise<DocumentInfo[]> {
  const { data } = await api.get(`/incidents/${incidentId}/documents/`);
  return data;
}

export async function uploadDocument(
  incidentId: number,
  file: File,
  description?: string
): Promise<DocumentInfo> {
  const form = new FormData();
  form.append("file", file);
  if (description) form.append("description", description);
  const { data } = await api.post(`/incidents/${incidentId}/documents/`, form);
  return data;
}

export async function deleteDocument(
  incidentId: number,
  documentId: number
): Promise<void> {
  await api.delete(`/incidents/${incidentId}/documents/${documentId}`);
}
