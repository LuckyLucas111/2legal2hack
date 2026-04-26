import api from "./client";
import type { Report } from "@/types";

export async function getReport(incidentId: number): Promise<Report | null> {
  const { data } = await api.get(`/incidents/${incidentId}/report/`);
  return data;
}

export async function saveReport(
  incidentId: number,
  content: string
): Promise<Report> {
  const { data } = await api.post(`/incidents/${incidentId}/report/`, {
    content,
  });
  return data;
}

export async function generateReport(incidentId: number): Promise<Report> {
  const { data } = await api.post(`/incidents/${incidentId}/report/generate`);
  return data;
}

export async function finalizeReport(incidentId: number): Promise<Report> {
  const { data } = await api.post(`/incidents/${incidentId}/report/finalize`);
  return data;
}

export function getReportPdfUrl(incidentId: number): string {
  return `/api/v1/incidents/${incidentId}/report/pdf`;
}
