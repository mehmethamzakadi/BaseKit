import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { notificationsApi, type NotificationQuery } from './notificationsApi'
import { getApiErrorMessage } from '@/types/api'
import type { BroadcastNotificationInput } from '@/types/notifications'

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (params: NotificationQuery) => ['notifications', 'list', params] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
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
    onSuccess: () => void qc.invalidateQueries({ queryKey: notificationKeys.all }),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.all })
      toast.success('Tüm bildirimler okundu olarak işaretlendi.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export function useDeleteNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.remove(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: notificationKeys.all }),
    onError: (error) => toast.error(getApiErrorMessage(error)),
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
