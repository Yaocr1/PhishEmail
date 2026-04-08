const rawApiBase = (import.meta.env.VITE_API_BASE_URL || "").trim();

export const API_BASE_URL = rawApiBase.replace(/\/+$/, "");

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
}
