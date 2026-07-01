import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { notificationsApi, type NotificationQuery } from './notificationsApi'
import { getApiErrorMessage, type PagedResult } from '@/types/api'
import type { AppNotification, BroadcastNotificationInput } from '@/types/notifications'

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: ['notifications', 'list'] as const,
  list: (params: NotificationQuery) => ['notifications', 'list', params] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
}

type ListCache = PagedResult<AppNotification>

/** Önbellekteki tüm bildirim listesi sorgularına bir dönüşüm uygular. */
function patchListCaches(
  qc: QueryClient,
  patch: (list: ListCache) => ListCache,
): void {
  qc.setQueriesData<ListCache>({ queryKey: notificationKeys.lists }, (old) =>
    old ? patch(old) : old,
  )
}

/**
 * Optimistic mutasyonlar için ortak hazırlık: ilgili sorguları iptal eder ve
 * geri alma (rollback) için mevcut önbellekleri anlık olarak yedekler.
 */
async function snapshotNotifications(qc: QueryClient) {
  await qc.cancelQueries({ queryKey: notificationKeys.all })
  return {
    lists: qc.getQueriesData<ListCache>({ queryKey: notificationKeys.lists }),
    unread: qc.getQueryData<number>(notificationKeys.unreadCount),
  }
}

type Snapshot = Awaited<ReturnType<typeof snapshotNotifications>>

/** Yedeklenen önbellekleri geri yükler (mutasyon hatasında çağrılır). */
function restoreNotifications(qc: QueryClient, snapshot?: Snapshot): void {
  if (!snapshot) return
  for (const [key, data] of snapshot.lists) qc.setQueryData(key, data)
  qc.setQueryData(notificationKeys.unreadCount, snapshot.unread)
}

export function useNotifications(params: NotificationQuery) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => notificationsApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useRecipients(search: string, enabled: boolean) {
  return useQuery({
    queryKey: ['notifications', 'recipients', search] as const,
    queryFn: () => notificationsApi.recipients(search || undefined),
    enabled,
    placeholderData: keepPreviousData,
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: notificationsApi.unreadCount,
    // SignalR canlı güncelliyor; yine de bağlantı kopması ihtimaline karşı yedek.
    refetchInterval: 60_000,
  })
}

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onMutate: async (id): Promise<Snapshot> => {
      const snapshot = await snapshotNotifications(qc)
      const nowIso = new Date().toISOString()
      let wasUnread = false
      patchListCaches(qc, (list) => ({
        ...list,
        items: list.items.map((n) => {
          if (n.id !== id || n.isRead) return n
          wasUnread = true
          return { ...n, isRead: true, readAtUtc: nowIso }
        }),
      }))
      if (wasUnread) {
        qc.setQueryData<number>(notificationKeys.unreadCount, (c) => Math.max(0, (c ?? 1) - 1))
      }
      return snapshot
    },
    onError: (error, _id, snapshot) => {
      restoreNotifications(qc, snapshot)
      toast.error(getApiErrorMessage(error))
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onMutate: async (): Promise<Snapshot> => {
      const snapshot = await snapshotNotifications(qc)
      const nowIso = new Date().toISOString()
      patchListCaches(qc, (list) => ({
        ...list,
        items: list.items.map((n) =>
          n.isRead ? n : { ...n, isRead: true, readAtUtc: nowIso },
        ),
      }))
      qc.setQueryData<number>(notificationKeys.unreadCount, 0)
      return snapshot
    },
    onError: (error, _vars, snapshot) => {
      restoreNotifications(qc, snapshot)
      toast.error(getApiErrorMessage(error))
    },
    onSuccess: () => toast.success('Tüm bildirimler okundu olarak işaretlendi.'),
    onSettled: () => void qc.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}

export function useDeleteNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.remove(id),
    onMutate: async (id): Promise<Snapshot> => {
      const snapshot = await snapshotNotifications(qc)
      let removedUnread = false
      patchListCaches(qc, (list) => {
        const target = list.items.find((n) => n.id === id)
        if (!target) return list
        if (!target.isRead) removedUnread = true
        return {
          ...list,
          items: list.items.filter((n) => n.id !== id),
          totalCount: Math.max(0, list.totalCount - 1),
        }
      })
      if (removedUnread) {
        qc.setQueryData<number>(notificationKeys.unreadCount, (c) => Math.max(0, (c ?? 1) - 1))
      }
      return snapshot
    },
    onError: (error, _id, snapshot) => {
      restoreNotifications(qc, snapshot)
      toast.error(getApiErrorMessage(error))
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}

export function useBroadcastNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: BroadcastNotificationInput) => notificationsApi.broadcast(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.all })
      toast.success('Bildirim gönderildi.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}
