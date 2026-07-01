import { Bitcoin, DollarSign, Euro, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
import { useMarkets } from '@/features/insights/queries'
import Sparkline from './Sparkline'
import type { MarketQuote } from '@/types/insights'

const META: Record<string, { icon: LucideIcon; tint: string }> = {
  BTCTRY: { icon: Bitcoin, tint: 'text-amber-500' },
  USDTRY: { icon: DollarSign, tint: 'text-emerald-500' },
  EURTRY: { icon: Euro, tint: 'text-sky-500' },
}

function formatPrice(q: MarketQuote): string {
  const fractionDigits = q.symbol === 'BTCTRY' ? 0 : 2
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(q.price)
}

function MarketCard({ quote }: { quote: MarketQuote }) {
  const meta = META[quote.symbol] ?? { icon: DollarSign, tint: 'text-slate-400' }
  const Icon = meta.icon
  const change = quote.changePercent24h
  const positive = (change ?? 0) >= 0

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
          <Icon className={`size-4 ${meta.tint}`} />
          {quote.label}
        </span>
        {change != null && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
              positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {positive ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
            %{Math.abs(change).toFixed(1)}
          </span>
        )}
      </div>

      <p className="text-xl font-bold text-slate-900 dark:text-slate-50">{formatPrice(quote)}</p>

      {quote.sparkline && quote.sparkline.length > 1 && (
        <Sparkline data={quote.sparkline} positive={positive} />
      )}
    </div>
  )
}

export default function MarketsWidget() {
  const { data, isLoading, isError, refetch } = useMarkets()

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
          />
        ))}
      </div>
    )
  }

  if (isError || !data || data.quotes.length === 0) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        <span>Piyasa verisi alınamadı.</span>
        <button
          type="button"
          onClick={() => void refetch()}
          className="font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          Tekrar dene
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {data.quotes.map((q) => (
        <MarketCard key={q.symbol} quote={q} />
      ))}
    </div>
  )
}
