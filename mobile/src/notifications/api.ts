import { api, type ApiEnvelope, unwrap } from '../api/client';
import type { AppNotification, Paged } from './types';

export const notificationsApi = {
  async list(params?: { is_read?: boolean }): Promise<Paged<AppNotification>> {
    const { data } = await api.get<ApiEnvelope<Paged<AppNotification>>>('/notifications/', {
      params,
    });
    return unwrap(data);
  },
  async unreadCount(): Promise<number> {
    const { data } = await api.get<ApiEnvelope<{ count: number }>>('/notifications/unread/');
    return unwrap(data).count;
  },
  async markRead(id: number): Promise<AppNotification> {
    const { data } = await api.patch<ApiEnvelope<AppNotification>>(`/notifications/${id}/`, {
      is_read: true,
    });
    return unwrap(data);
  },
  async markAllRead(): Promise<number> {
    const { data } = await api.post<ApiEnvelope<{ marked: number }>>('/notifications/mark-all-read/');
    return unwrap(data).marked;
  },
};