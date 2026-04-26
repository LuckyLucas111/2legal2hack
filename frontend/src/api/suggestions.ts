import api from "./client";
import type { Suggestion } from "@/types";

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
  status: string
): Promise<Suggestion> {
  const { data } = await api.patch(
    `/incidents/${incidentId}/suggestions/${suggestionId}`,
    { status }
  );
  return data;
}
