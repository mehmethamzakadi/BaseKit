import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Check,
  Trash2,
  Megaphone,
  CheckCheck,
  type LucideIcon,
} from 'lucide-react'
import PageHeader from '@/components/dashboard/PageHeader'
import Button from '@/components/ui/Button'
import TableSkeleton from '@/components/ui/TableSkeleton'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import Pagination from '@/components/ui/Pagination'
import BroadcastModal from './BroadcastModal'
import {
  useDeleteNotification,
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  useUnreadCount,
} from '@/features/notifications/queries'
import { useAuth } from '@/features/auth/useAuth'
import { usePublicSettings } from '@/features/settings/usePublicSettings'
import { buildPageSizeOptions } from '@/lib/pageSize'
import { getApiErrorMessage } from '@/types/api'
import type { AppNotification, NotificationType } from '@/types/notifications'

const PAGE_SIZE_OPTIONS = [20, 50, 100]

const typeMeta: Record<NotificationType, { icon: LucideIcon; className: string }> = {
  info: { icon: Info, className: 'text-sky-500' },
  success: { icon: CheckCircle2, className: 'text-emerald-500' },
  warning: { icon: AlertTriangle, className: 'text-amber-500' },
  error: { icon: AlertCircle, className: 'text-red-500' },
}

const dateFmt = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' })

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canSend = hasPermission('notifications.send')
  const { defaultPageSize } = usePublicSettings()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [broadcastOpen, setBroadcastOpen] = useState(false)

  useEffect(() => {
    setPage(1)
  }, [unreadOnly])

  const changePageSize = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  const { data, isLoading, isError, error, refetch, isPlaceholderData } = useNotifications({
    page,
    pageSize,
    unreadOnly: unreadOnly || undefined,
  })
  const { data: unread } = useUnreadCount()
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()
  const remove = useDeleteNotification()

  const items = data?.items ?? []
  const hasResults = items.length > 0
  const unreadCount = unread ?? 0

  const onRowClick = (n: AppNotification) => {
    if (!n.isRead) markRead.mutate(n.id)
    if (n.link) navigate(n.link)
  }

  return (
    <div>
      <PageHeader
        title="Bildirimler"
        description="Size gelen bildirimleri görüntüleyin ve yönetin."
        actions={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => markAllRead.mutate()}
                loading={markAllRead.isPending}
              >
                <CheckCheck className="size-4" />
                Tümünü okundu işaretle
              </Button>
            )}
            {canSend && (
              <Button type="button" onClick={() => setBroadcastOpen(true)}>
                <Megaphone className="size-4" />
                Bildirim gönder
              </Button>
            )}
          </div>
        }
      />

      {/* Filtre sekmeleri */}
      <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
        {[
          { key: false, label: 'Tümü' },
          { key: true, label: `Okunmamış${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
        ].map((tab) => (
          <button
            key={String(tab.key)}
            type="button"
            onClick={() => setUnreadOnly(tab.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              unreadOnly === tab.key
                ? 'bg-brand-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <TableSkeleton columns={3} />
      ) : isError ? (
        <ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} />
      ) : hasResults ? (
        <div
          className={`overflow-hidden rounded-xl border border-slate-200 bg-white transition-opacity dark:border-slate-700 dark:bg-slate-900 ${
            isPlaceholderData ? 'opacity-60' : ''
          }`}
        >
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((n) => {
              const meta = typeMeta[n.type] ?? typeMeta.info
              const Icon = meta.icon
              return (
                <li
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 ${
                    n.isRead ? '' : 'bg-brand-50/50 dark:bg-brand-500/10'
                  }`}
                >
                  <Icon className={`mt-0.5 size-5 shrink-0 ${meta.className}`} />
                  <button
                    type="button"
                    onClick={() => onRowClick(n)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="size-2 shrink-0 rounded-full bg-brand-500" aria-hidden />
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{n.message}</p>
                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                      {dateFmt.format(new Date(n.createdAtUtc))}
                    </p>
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={() => markRead.mutate(n.id)}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800"
                        aria-label="Okundu işaretle"
                        title="Okundu işaretle"
                      >
                        <Check className="size-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => remove.mutate(n.id)}
                      className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
                      aria-label="Sil"
                      title="Sil"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
          {data && (
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              totalCount={data.totalCount}
              totalPages={data.totalPages}
              onPageChange={setPage}
              pageSizeOptions={buildPageSizeOptions(defaultPageSize, PAGE_SIZE_OPTIONS)}
              onPageSizeChange={changePageSize}
            />
          )}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title={unreadOnly ? 'Okunmamış bildirim yok' : 'Henüz bildiriminiz yok'}
          description={
            unreadOnly
              ? 'Tüm bildirimlerinizi okudunuz.'
              : 'Yeni bildirimler geldikçe burada listelenecek.'
          }
        />
      )}

      {broadcastOpen && <BroadcastModal onClose={() => setBroadcastOpen(false)} />}
    </div>
  )
}
