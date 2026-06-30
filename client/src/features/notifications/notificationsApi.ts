import { apiClient } from '@/lib/apiClient'
import type { PagedQuery, PagedResult } from '@/types/api'
import type { AppNotification, BroadcastNotificationInput, RecipientDto } from '@/types/notifications'

export interface NotificationQuery extends PagedQuery {
  unreadOnly?: boolean
}

/** Bildirim uç noktalarının tiplenmiş sarmalayıcıları. */
export const notificationsApi = {
  list: (params: NotificationQuery = {}) =>
    apiClient
      .get<PagedResult<AppNotification>>('/notifications', { params })
      .then((r) => r.data),

  unreadCount: () =>
    apiClient
      .get<{ count: number }>('/notifications/unread-count')
      .then((r) => r.data.count),

  markRead: (id: string) =>
    apiClient.post<void>(`/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () =>
    apiClient.post<void>('/notifications/read-all').then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete<void>(`/notifications/${id}`).then((r) => r.data),

  broadcast: (body: BroadcastNotificationInput) =>
    apiClient.post<void>('/notifications/broadcast', body).then((r) => r.data),

  recipients: (search?: string) =>
    apiClient
      .get<RecipientDto[]>('/notifications/recipients', { params: { search } })
      .then((r) => r.data),
}
