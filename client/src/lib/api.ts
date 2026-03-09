import type { Member, MonthSchedule, ScheduleEntry, PushSubscriptionData } from "@/types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
const TOKEN_KEY = "tortilla-admin-token";

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    let message: string;
    try {
      const json: unknown = JSON.parse(body);
      message =
        typeof json === "object" && json !== null && "error" in json
          ? String((json as { error: unknown }).error)
          : body;
    } catch {
      message = body;
    }
    throw new Error(message || `Error ${String(res.status)}`);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

// Auth
export async function login(password: string): Promise<{ token: string }> {
  const result = await request<{ token: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
  setToken(result.token);
  return result;
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    await request<unknown>("/api/auth/verify", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return true;
  } catch {
    return false;
  }
}

// Members
export async function getMembers(): Promise<Member[]> {
  return request<Member[]>("/api/members");
}

export async function addMember(
  name: string,
  email?: string
): Promise<Member> {
  return request<Member>("/api/members", {
    method: "POST",
    body: JSON.stringify({ name, email }),
  });
}

export async function updateMember(
  id: number,
  data: Partial<Member>
): Promise<Member> {
  return request<Member>(`/api/members/${String(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteMember(id: number): Promise<void> {
  await request<void>(`/api/members/${String(id)}`, {
    method: "DELETE",
  });
}

export async function reorderMembers(memberIds: number[]): Promise<void> {
  await request<void>("/api/members/reorder", {
    method: "PUT",
    body: JSON.stringify({ memberIds }),
  });
}

// Schedule
export async function getSchedule(
  year: number,
  month: number
): Promise<MonthSchedule> {
  const raw = await request<{ year: number; month: number; schedule: Record<string, any> }>(
    `/api/schedule?year=${String(year)}&month=${String(month)}`
  );
  const schedule: MonthSchedule = {};
  for (const [date, entry] of Object.entries(raw.schedule)) {
    if (entry.member) {
      schedule[date] = { member: entry.member, isOverride: false };
    }
  }
  return schedule;
}

export async function removeAssignment(date: string): Promise<void> {
  await request<void>(`/api/schedule/override/${date}`, {
    method: "DELETE",
  });
}

export async function getTodaySchedule(): Promise<ScheduleEntry> {
  return request<ScheduleEntry>("/api/schedule/today");
}

export async function createOverride(
  date: string,
  memberId: number,
  reason?: string
): Promise<void> {
  await request<void>("/api/schedule/override", {
    method: "POST",
    body: JSON.stringify({ date, memberId, reason }),
  });
}

// Notifications
export async function subscribePush(
  subscription: PushSubscriptionData
): Promise<void> {
  await request<void>("/api/notifications/subscribe", {
    method: "POST",
    body: JSON.stringify(subscription),
  });
}
