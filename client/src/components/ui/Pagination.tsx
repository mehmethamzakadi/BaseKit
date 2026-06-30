import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  onPageChange: (page: number) => void
  /** Verilirse sayfa başına kayıt seçici gösterilir. */
  pageSizeOptions?: number[]
  onPageSizeChange?: (pageSize: number) => void
}

/**
 * Sayfalama çubuğu: opsiyonel sayfa boyutu seçici + "X–Y / Z kayıt" özeti +
 * önceki/sonraki. Sayfalı liste sonuçlarının altında kullanılır.
 */
export default function Pagination({
  page,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
}: PaginationProps) {
  if (totalCount === 0) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalCount)
  const showSizeSelector = pageSizeOptions != null && onPageSizeChange != null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
      <div className="flex flex-wrap items-center gap-4">
        <span>
          <span className="font-medium text-slate-800">{from}</span>–
          <span className="font-medium text-slate-800">{to}</span> / {totalCount} kayıt
        </span>
        {showSizeSelector && (
          <label className="flex items-center gap-2 text-slate-500">
            Sayfa başına
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-lg border border-slate-300 py-1 pl-2 pr-7 text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="size-4" />
          Önceki
        </button>
        <span className="text-slate-500">
          {page} / {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Sonraki
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
