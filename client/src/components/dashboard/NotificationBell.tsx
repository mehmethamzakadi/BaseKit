import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react'
import { useMarkAllRead, useMarkRead, useNotifications, useUnreadCount } from '@/features/notifications/queries'
import type { AppNotification, NotificationType } from '@/types/notifications'

const typeMeta: Record<NotificationType, { icon: LucideIcon; className: string }> = {
  info: { icon: Info, className: 'text-sky-500' },
  success: { icon: CheckCircle2, className: 'text-emerald-500' },
  warning: { icon: AlertTriangle, className: 'text-amber-500' },
  error: { icon: AlertCircle, className: 'text-red-500' },
}

const relTime = new Intl.RelativeTimeFormat('tr-TR', { numeric: 'auto' })

function formatRelative(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now()
  const diffMin = Math.round(diffMs / 60_000)
  if (Math.abs(diffMin) < 60) return relTime.format(diffMin, 'minute')
  const diffHour = Math.round(diffMin / 60)
  if (Math.abs(diffHour) < 24) return relTime.format(diffHour, 'hour')
  const diffDay = Math.round(diffHour / 24)
  return relTime.format(diffDay, 'day')
}

export default function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const { data: unread } = useUnreadCount()
  const { data } = useNotifications({ page: 1, pageSize: 8 })
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()

  const items = data?.items ?? []
  const unreadCount = unread ?? 0

  const onItemClick = (n: AppNotification) => {
    if (!n.isRead) markRead.mutate(n.id)
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Bildirimler"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800 sm:w-96">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Bildirimler</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead.mutate()}
                  className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                >
                  Tümünü okundu işaretle
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  Henüz bildiriminiz yok.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {items.map((n) => {
                    const meta = typeMeta[n.type] ?? typeMeta.info
                    const Icon = meta.icon
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => onItemClick(n)}
                          className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700/40 ${
                            n.isRead ? '' : 'bg-brand-50/50 dark:bg-brand-500/10'
                          }`}
                        >
                          <Icon className={`mt-0.5 size-5 shrink-0 ${meta.className}`} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                              {n.title}
                            </p>
                            <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                              {n.message}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                              {formatRelative(n.createdAtUtc)}
                            </p>
                          </div>
                          {!n.isRead && (
                            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-500" aria-hidden />
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setOpen(false)
                navigate('/dashboard/notifications')
              }}
              className="block w-full border-t border-slate-100 px-4 py-2.5 text-center text-sm font-medium text-brand-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-brand-400 dark:hover:bg-slate-700/40"
            >
              Tümünü gör
            </button>
          </div>
        </>
      )}
    </div>
  )
}
