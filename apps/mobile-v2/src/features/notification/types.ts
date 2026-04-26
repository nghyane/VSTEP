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

export interface ReadNotificationResult {
  read: boolean;
}

export interface PaginatedNotifications {
  data: Notification[];
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}
