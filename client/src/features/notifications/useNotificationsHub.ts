import { useEffect, useRef } from 'react'
import * as signalR from '@microsoft/signalr'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { env } from '@/config/env'
import { tokenStorage } from '@/features/auth/tokenStorage'
import { notificationKeys } from './queries'
import type { AppNotification, NotificationType } from '@/types/notifications'

const TOAST_ICON: Record<NotificationType, string> = {
  info: '🔔',
  success: '✅',
  warning: '⚠️',
  error: '⛔',
}

/**
 * Bildirimler için SignalR bağlantısını yönetir. Oturum açık alanda (dashboard)
 * bir kez kurulur; sunucudan "ReceiveNotification" geldiğinde ilgili sorguları
 * geçersiz kılar ve bir toast gösterir. Token süresi dolarsa accessTokenFactory
 * yeniden bağlanmada güncel token'ı sağlar.
 */
export function useNotificationsHub() {
  const qc = useQueryClient()
  const connectionRef = useRef<signalR.HubConnection | null>(null)

  useEffect(() => {
    if (!tokenStorage.hasTokens()) return

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${env.apiUrl}/hubs/notifications`, {
        accessTokenFactory: () => tokenStorage.getAccessToken() ?? '',
      })
      .withAutomaticReconnect()
      .build()

    connection.on('ReceiveNotification', (n: AppNotification) => {
      void qc.invalidateQueries({ queryKey: notificationKeys.all })
      toast(n.title, { icon: TOAST_ICON[n.type] ?? '🔔' })
    })

    connectionRef.current = connection
    // Başlatma hatası sessiz geçilir; otomatik yeniden bağlanma devreye girer.
    connection.start().catch(() => {})

    return () => {
      connectionRef.current = null
      void connection.stop()
    }
  }, [qc])
}
