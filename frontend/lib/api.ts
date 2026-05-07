import { API_BASE_URL } from "./api-config";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  status: "active" | "blocked";
};

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
