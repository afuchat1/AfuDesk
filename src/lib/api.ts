import type { Chat, Message, Profile, Session, User, Website } from "./types";

const TOKEN_KEY = "afudesk_session_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(path, { ...options, headers });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.error || "Request failed");
  }

  return data as T;
}

export const api = {
  async login(email: string, password: string) {
    const data = await request<{ token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    return data;
  },
  async signup(email: string, password: string, displayName: string) {
    const data = await request<{ token: string; user: User }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, displayName }),
    });
    setToken(data.token);
    return data;
  },
  async me() {
    if (!getToken()) return { user: null, session: null };
    return request<{ user: User; session: Session }>("/api/auth/me");
  },
  async logout() {
    setToken(null);
  },
  getProfile: () => request<Profile | null>("/api/profile"),
  updateProfile: (body: { display_name: string; company_name: string }) =>
    request<Profile>("/api/profile", { method: "PUT", body: JSON.stringify(body) }),
  getWebsites: () => request<Website[]>("/api/websites"),
  createWebsite: (body: { name: string; domain: string }) =>
    request<Website>("/api/websites", { method: "POST", body: JSON.stringify(body) }),
  deleteWebsite: (id: string) => request<{ success: boolean }>(`/api/websites/${id}`, { method: "DELETE" }),
  getStats: () => request<{ totalWebsites: number; totalChats: number; openChats: number; totalMessages: number }>("/api/dashboard/stats"),
  getChats: () => request<(Chat & { website_name?: string; last_message?: string })[]>("/api/chats"),
  getMessages: (chatId: string) => request<Message[]>(`/api/chats/${chatId}/messages`),
  sendAgentMessage: (chatId: string, content: string) =>
    request<Message>(`/api/chats/${chatId}/messages`, { method: "POST", body: JSON.stringify({ content }) }),
  updateChatStatus: (chatId: string, status: "open" | "closed") =>
    request<Chat>(`/api/chats/${chatId}`, { method: "PATCH", body: JSON.stringify({ status }) }),
};
