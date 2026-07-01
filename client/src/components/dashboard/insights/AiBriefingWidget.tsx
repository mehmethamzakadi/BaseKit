import { RefreshCw, Sparkles } from 'lucide-react'
import { useBriefing } from '@/features/insights/queries'
import type { Coords } from '@/types/insights'

/**
 * Yapay zeka (Gemini) günlük brifing: hava + piyasa + gündemi tek bir doğal
 * Türkçe özete çeviren hero şerit. Hata/yükleme durumlarını zarifçe yönetir;
 * AI kullanılamıyorsa dashboard'ın geri kalanını etkilemeden sessizce gizlenir.
 */
export default function AiBriefingWidget({ coords }: { coords: Coords | null }) {
  const { data, isLoading, isError, isFetching, refetch } = useBriefing(coords)

  // AI tamamen başarısızsa (ör. kota/anahtar) hero'yu göstermeyip yer kaplamayalım.
  if (isError && !data) return null

  return (
    <section className="relative overflow-hidden rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-50 via-white to-indigo-50 p-5 dark:border-brand-500/20 dark:from-brand-500/10 dark:via-slate-900 dark:to-indigo-500/10">
      <div className="flex items-start gap-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
          <Sparkles className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
              Günün Özeti · Yapay Zeka
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-600 transition hover:bg-brand-100/60 disabled:opacity-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
              aria-label="Yenile"
            >
              <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              Yenile
            </button>
          </div>

          {isLoading ? (
            <div className="mt-2 space-y-2" aria-hidden>
              <div className="h-3.5 w-full animate-pulse rounded bg-brand-200/50 dark:bg-brand-500/20" />
              <div className="h-3.5 w-11/12 animate-pulse rounded bg-brand-200/50 dark:bg-brand-500/20" />
              <div className="h-3.5 w-2/3 animate-pulse rounded bg-brand-200/50 dark:bg-brand-500/20" />
            </div>
          ) : (
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              {data?.text}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
