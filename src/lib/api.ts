const rawApiBase = (import.meta.env.VITE_API_BASE_URL || "").trim();
const rawModelFallbackUrl = (import.meta.env.VITE_HF_FALLBACK_URL || "https://alimusarizvi-phishing-email.hf.space/predict").trim();

export const API_BASE_URL = rawApiBase.replace(/\/+$/, "");
export const HF_FALLBACK_URL = rawModelFallbackUrl.replace(/\/+$/, "");

export const API_CONNECTION_HINT = API_BASE_URL
  ? `Backend API URL: ${API_BASE_URL}`
  : "Set VITE_API_BASE_URL to your backend URL in Netlify environment settings.";

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
}

export function getApiErrorMessage(action: string, error: unknown, statusCode?: number) {
  const statusUnavailable = statusCode === 404 || statusCode === 502 || statusCode === 503 || statusCode === 504;

  if (statusUnavailable) {
    return `${action} Backend endpoint is unavailable. ${API_CONNECTION_HINT}`;
  }

  if (error instanceof Error) {
    if (/failed to fetch|networkerror|load failed/i.test(error.message)) {
      return `${action} Unable to reach backend service. ${API_CONNECTION_HINT}`;
    }

    return error.message;
  }

  return `${action} ${API_CONNECTION_HINT}`;
}
