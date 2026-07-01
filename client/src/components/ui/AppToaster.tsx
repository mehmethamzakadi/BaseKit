import {
  Toaster,
  resolveValue,
  toast as hotToast,
  type Toast,
} from 'react-hot-toast'
import {
  CheckCircle2,
  Info,
  AlertCircle,
  X,
  type LucideIcon,
} from 'lucide-react'

type ToastKind = 'success' | 'error' | 'loading' | 'blank'

const KIND_META: Record<ToastKind, { icon: LucideIcon; accent: string; iconClass: string }> = {
  success: {
    icon: CheckCircle2,
    accent: 'bg-emerald-500',
    iconClass: 'text-emerald-500',
  },
  error: {
    icon: AlertCircle,
    accent: 'bg-red-500',
    iconClass: 'text-red-500',
  },
  loading: {
    icon: Info,
    accent: 'bg-brand-500',
    iconClass: 'text-brand-500',
  },
  blank: {
    icon: Info,
    accent: 'bg-brand-500',
    iconClass: 'text-brand-500',
  },
}

/** Tek bir toast kartını uygulama tasarımına uygun şekilde render eder. */
function AppToast({ t }: { t: Toast }) {
  const kind: ToastKind = (['success', 'error', 'loading'] as const).includes(
    t.type as 'success' | 'error' | 'loading',
  )
    ? (t.type as ToastKind)
    : 'blank'

  const meta = KIND_META[kind]
  const Icon = meta.icon
  const message = resolveValue(t.message, t)

  return (
    <div
      className={`pointer-events-auto flex w-full max-w-sm items-stretch gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5 ring-1 ring-black/[0.02] dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/30 ${
        t.visible ? 'animate-toast-enter' : 'animate-toast-leave'
      }`}
      role="status"
    >
      {/* Sol renk şeridi */}
      <span className={`w-1 shrink-0 ${meta.accent}`} aria-hidden />

      <div className="flex flex-1 items-start gap-3 px-4 py-3">
        {t.type === 'loading' ? (
          <span className="mt-0.5 size-5 shrink-0 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        ) : t.icon && typeof t.icon === 'string' ? (
          <span className="mt-0.5 text-lg leading-none">{t.icon}</span>
        ) : (
          <Icon className={`mt-0.5 size-5 shrink-0 ${meta.iconClass}`} />
        )}

        <div className="min-w-0 flex-1 pt-0.5 text-sm leading-snug text-slate-700 dark:text-slate-200">
          {message}
        </div>

        {t.type !== 'loading' && (
          <button
            type="button"
            onClick={() => hotToast.dismiss(t.id)}
            className="-mr-1 -mt-0.5 shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            aria-label="Kapat"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Uygulama genelindeki bildirim/toast kutucukları. Sağ alt köşede konumlanır ve
 * mevcut `toast.success/error/...` çağrılarını değiştirmeden özel, tema uyumlu
 * bir tasarımla render eder.
 */
export default function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      gutter={12}
      toastOptions={{ duration: 4000 }}
      containerClassName="!bottom-6 !right-6"
    >
      {(t) => <AppToast t={t} />}
    </Toaster>
  )
}
