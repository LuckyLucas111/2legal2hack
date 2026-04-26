import api from "./client";
import type { DashboardData, TimelineEvent } from "@/types";

export async function getDashboard(role: string): Promise<DashboardData> {
  const { data } = await api.get(`/dashboard?role=${role}`);
  return data;
}

export async function getTimeline(incidentId: number): Promise<TimelineEvent[]> {
  const { data } = await api.get(`/incidents/${incidentId}/timeline`);
  return data;
}
