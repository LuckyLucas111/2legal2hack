import axios from "axios";
import { toast } from "sonner";

const api = axios.create({
  baseURL: "/api/v1",
});

export function setRoleHeader(role: string) {
  api.defaults.headers.common["X-Role"] = role;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ??
      error.response?.data?.message ??
      error.message ??
      "An unexpected error occurred";
    toast.error(message);
    return Promise.reject(error);
  },
);

export default api;
