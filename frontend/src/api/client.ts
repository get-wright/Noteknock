const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";
const TOKEN_KEY = "noteknock_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  form?: URLSearchParams;
  auth?: boolean;
};

export async function apiRequest<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, form, auth = true } = opts;
  const headers: Record<string, string> = {};
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  let payload: BodyInit | undefined;
  if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    payload = form.toString();
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: payload });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = (await res.json()) as { detail?: string; message?: string };
      message = data.detail ?? data.message ?? message;
    } catch {
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return null as T;
  const text = await res.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}