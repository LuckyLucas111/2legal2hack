import api from "./client";
import type { Task } from "@/types";

export async function getIncidentTasks(incidentId: number): Promise<Task[]> {
  const { data } = await api.get(`/incidents/${incidentId}/tasks`);
  return data;
}

export async function createTask(
  incidentId: number,
  payload: {
    title: string;
    description?: string;
    assigned_to_role: string;
    priority?: string;
    task_type?: string;
  }
): Promise<Task> {
  const { data } = await api.post(`/incidents/${incidentId}/tasks`, payload);
  return data;
}

export async function updateTask(
  incidentId: number,
  taskId: number,
  payload: { status?: string; response?: string; priority?: string },
  file?: File
): Promise<Task> {
  const formData = new FormData();
  if (payload.status) formData.append("status", payload.status);
  if (payload.response) formData.append("response", payload.response);
  if (payload.priority) formData.append("priority", payload.priority);
  if (file) formData.append("file", file);

  const { data } = await api.patch(
    `/incidents/${incidentId}/tasks/${taskId}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}

export async function getTasksByRole(role: string): Promise<Task[]> {
  const { data } = await api.get(`/tasks/by-role/${role}`);
  return data;
}
