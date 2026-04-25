// Notification feature types
export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  iconKey: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface UnreadCount {
  count: number;
}

export interface ReadAllResult {
  marked: number;
}

export interface PaginatedNotifications {
  data: Notification[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
