const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_URL = (
  configuredApiBaseUrl || "http://127.0.0.1:5001"
).replace(/\/+$/, "");

export function apiUrl(path) {
  return `${API_URL}/${path.replace(/^\/+/, "")}`;
}
