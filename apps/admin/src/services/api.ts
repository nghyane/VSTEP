const BASE = '/api/v1';

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message ?? 'Request failed');
  }
  return res.json();
}

export type Stats = {
  users_total: number;
  users_today: number;
  users_this_week: number;
  exams_total: number;
  exams_published: number;
  exams_draft: number;
  sessions_active: number;
  sessions_today: number;
  sessions_stuck: number;
  grading_pending: number;
  grading_failed: number;
  grading_done_today: number;
  vocab_topics: number;
  grammar_points: number;
  courses: number;
};

export type Alert = {
  type: 'error' | 'warning' | 'info';
  message: string;
  action: string;
};

export type ActionItem = {
  label: string;
  action: string;
  badge: number;
};

export type ContentStatusItem = {
  type: string;
  published: number;
  draft: number;
};

export type RecentActivityItem = {
  action: string;
  detail: string;
  happened_at: string;
};

export const fetchStats = () => request<{ data: Stats }>('/admin/stats').then((r) => r.data);
export const fetchAlerts = () => request<{ data: Alert[] }>('/admin/alerts').then((r) => r.data);
export const fetchActionItems = () => request<{ data: ActionItem[] }>('/admin/action-items').then((r) => r.data);
export const fetchContentStatus = () => request<{ data: ContentStatusItem[] }>('/admin/content-status').then((r) => r.data);
export const fetchRecentActivity = () => request<{ data: RecentActivityItem[] }>('/admin/recent-activity').then((r) => r.data);
