import type { ReactNode } from 'react'
import { RefreshCw, type LucideIcon } from 'lucide-react'

interface WidgetProps {
  title: string
  icon?: LucideIcon
  action?: ReactNode
  loading?: boolean
  error?: boolean
  onRetry?: () => void
  className?: string
  children?: ReactNode
}

/**
 * Dashboard dış-veri widget'ları için ortak kart çerçevesi: başlık + ikon,
 * yükleniyor (skeleton) ve hata (tekrar dene) durumlarını tek yerde yönetir.
 */
export default function Widget({
  title,
  icon: Icon,
  action,
  loading,
  error,
  onRetry,
  className = '',
  children,
}: WidgetProps) {
  return (
    <section
      className={`flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 ${className}`}
    >
      <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="size-4 text-slate-400 dark:text-slate-500" />}
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
        </div>
        {action}
      </header>

      <div className="flex-1 p-4">
        {loading ? (
          <div className="space-y-2" aria-hidden>
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">Veri alınamadı.</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-brand-600 transition hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
              >
                <RefreshCw className="size-3.5" />
                Tekrar dene
              </button>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  )
}
