import api from "./client";
import type { Incident } from "@/types";

export async function getIncidents(): Promise<Incident[]> {
  const { data } = await api.get("/incidents/");
  return data;
}

export async function getIncident(id: number): Promise<Incident> {
  const { data } = await api.get(`/incidents/${id}`);
  return data;
}

export async function createIncident(payload: {
  title: string;
  description: string;
  severity?: string;
}): Promise<Incident> {
  const { data } = await api.post("/incidents/", payload);
  return data;
}

export async function updateIncident(
  id: number,
  payload: Partial<Incident>
): Promise<Incident> {
  const { data } = await api.patch(`/incidents/${id}`, payload);
  return data;
}

export async function submitNotifiability(
  id: number,
  payload: {
    gdpr_applicable: boolean;
    nis2_applicable: boolean;
    notifiability_assessment: string;
    data_categories?: string[];
    individuals_affected?: string;
    potential_harm?: string;
  }
): Promise<Incident> {
  const { data } = await api.patch(`/incidents/${id}/notifiability`, payload);
  return data;
}

export async function submitRiskClassification(
  id: number,
  payload: { risk_classification: string }
): Promise<Incident> {
  const { data } = await api.patch(
    `/incidents/${id}/risk-classification`,
    payload
  );
  return data;
}

export async function submitNotificationDecision(
  id: number,
  payload: {
    notification_decision: "notify" | "no_notify";
    notification_decision_reason: string;
  }
): Promise<Incident> {
  const { data } = await api.patch(
    `/incidents/${id}/notification-decision`,
    payload
  );
  return data;
}
