export type NotificationType = 'info' | 'success' | 'warning' | 'error'

/** Backend `NotificationResponse` karşılığı (REST + SignalR push aynı sözleşme). */
export interface AppNotification {
  id: string
  title: string
  message: string
  type: NotificationType
  link?: string | null
  isRead: boolean
  createdAtUtc: string
  readAtUtc?: string | null
}

/** Bildirim alıcısı adayı (kullanıcı seçici için). */
export interface RecipientDto {
  id: string
  email?: string | null
  displayName?: string | null
}

/** Yönetici duyuru/bildirim gönderme girdisi. */
export interface BroadcastNotificationInput {
  title: string
  message: string
  type?: NotificationType
  link?: string | null
  /** Boş bırakılırsa tüm aktif kullanıcılara gönderilir. */
  userId?: string | null
}
