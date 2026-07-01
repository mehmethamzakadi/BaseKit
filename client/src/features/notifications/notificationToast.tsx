import { useLayoutEffect, useRef, useState } from 'react'
import toast, { type Toast } from 'react-hot-toast'
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { AppNotification, NotificationType } from '@/types/notifications'

type TypeMeta = {
  icon: LucideIcon
  label: string
  accent: string
  chipBg: string
  chipIcon: string
}

const TYPE_META: Record<NotificationType, TypeMeta> = {
  info: {
    icon: Info,
    label: 'Bilgi',
    accent: 'bg-brand-500',
    chipBg: 'bg-brand-50 dark:bg-brand-500/15',
    chipIcon: 'text-brand-600 dark:text-brand-400',
  },
  success: {
    icon: CheckCircle2,
    label: 'Başarılı',
    accent: 'bg-emerald-500',
    chipBg: 'bg-emerald-50 dark:bg-emerald-500/15',
    chipIcon: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Uyarı',
    accent: 'bg-amber-500',
    chipBg: 'bg-amber-50 dark:bg-amber-500/15',
    chipIcon: 'text-amber-600 dark:text-amber-400',
  },
  error: {
    icon: AlertCircle,
    label: 'Hata',
    accent: 'bg-red-500',
    chipBg: 'bg-red-50 dark:bg-red-500/15',
    chipIcon: 'text-red-600 dark:text-red-400',
  },
}

// eslint-disable-next-line react-refresh/only-export-components -- yardımcı fonksiyonla aynı dosyada; hızlı yenileme bu toast için önemsiz.
function NotificationToastCard({ t, n }: { t: Toast; n: AppNotification }) {
  const meta = TYPE_META[n.type] ?? TYPE_META.info
  const Icon = meta.icon

  const [expanded, setExpanded] = useState(false)
  const [isTruncated, setIsTruncated] = useState(false)
  const messageRef = useRef<HTMLParagraphElement>(null)

  // Mesaj 3 satırı aşıyorsa "Devamını oku" bağlantısını göster.
  useLayoutEffect(() => {
    const el = messageRef.current
    if (el) setIsTruncated(el.scrollHeight - el.clientHeight > 1)
  }, [])

  const goToLink = () => {
    toast.dismiss(t.id)
    if (n.link) window.location.assign(n.link)
  }

  return (
    <div
      className={`pointer-events-auto flex w-full max-w-md items-stretch overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 ring-1 ring-black/[0.02] dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/40 ${
        t.visible ? 'animate-toast-enter' : 'animate-toast-leave'
      }`}
      role="alert"
    >
      {/* Sol renk şeridi (bildirim türü) */}
      <span className={`w-1.5 shrink-0 ${meta.accent}`} aria-hidden />

      <div className="flex min-w-0 flex-1 gap-3 p-4">
        {/* Tür simgesi rozeti */}
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${meta.chipBg}`}
          aria-hidden
        >
          <Icon className={`size-5 ${meta.chipIcon}`} />
        </span>

        <div className="min-w-0 flex-1">
          {/* Üst satır: "Yeni Bildirim" etiketi + tür rozeti */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
              Yeni Bildirim
            </span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${meta.chipBg} ${meta.chipIcon}`}
            >
              {meta.label}
            </span>
          </div>

          {/* Başlık */}
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {n.title}
          </p>

          {/* Mesaj gövdesi */}
          {n.message && (
            <p
              ref={messageRef}
              className={`mt-0.5 text-[13px] leading-snug text-slate-600 dark:text-slate-300 ${
                expanded ? '' : 'line-clamp-3'
              }`}
            >
              {n.message}
            </p>
          )}

          {/* Aksiyonlar: uzun mesajda "Devamını oku", link varsa "Görüntüle" */}
          {(isTruncated || n.link) && (
          <div className="mt-2 flex items-center gap-3">
            {isTruncated && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="text-xs font-medium text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
              >
                {expanded ? 'Daha az göster' : 'Devamını oku'}
              </button>
            )}

            {n.link && (
              <button
                type="button"
                onClick={goToLink}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 transition hover:gap-1.5 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
              >
                Görüntüle
                <ArrowRight className="size-3.5" />
              </button>
            )}
          </div>
          )}
        </div>

        {/* Kapat */}
        <button
          type="button"
          onClick={() => toast.dismiss(t.id)}
          className="-mr-1 -mt-1 size-7 shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          aria-label="Kapat"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}

/**
 * Sunucudan SignalR ile gelen yeni bildirimi zengin bir toast kartı olarak
 * gösterir: tür simgesi, "Yeni Bildirim" etiketi, başlık, mesaj gövdesi ve
 * (varsa) görüntüleme bağlantısı.
 */
export function showNotificationToast(n: AppNotification) {
  toast.custom((t) => <NotificationToastCard t={t} n={n} />, {
    duration: 6000,
    ariaProps: { role: 'alert', 'aria-live': 'assertive' },
  })
}
