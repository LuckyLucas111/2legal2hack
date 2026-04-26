import api from "./client";
import type { Suggestion } from "@/types";

export interface SuggestionUpdatePayload {
  status?: string;
  title?: string;
  description?: string;
  target_role?: string;
  priority?: string;
  task_type?: string;
}

export async function getSuggestions(incidentId: number): Promise<Suggestion[]> {
  const { data } = await api.get(`/incidents/${incidentId}/suggestions/`);
  return data;
}

export async function generateSuggestions(
  incidentId: number
): Promise<Suggestion[]> {
  const { data } = await api.post(
    `/incidents/${incidentId}/suggestions/generate`
  );
  return data;
}

export async function updateSuggestion(
  incidentId: number,
  suggestionId: number,
  payload: SuggestionUpdatePayload
): Promise<Suggestion> {
  const { data } = await api.patch(
    `/incidents/${incidentId}/suggestions/${suggestionId}`,
    payload
  );
  return data;
}
