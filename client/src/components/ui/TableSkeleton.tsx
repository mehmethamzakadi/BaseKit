import Skeleton from './Skeleton'

interface TableSkeletonProps {
  columns: number
  rows?: number
}

/** Tablo yüklenirken gösterilen iskelet (kart + satır parıltıları). */
export default function TableSkeleton({ columns, rows = 6 }: TableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800">
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 py-4">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} className={`h-4 ${c === 0 ? 'w-40' : 'w-20'}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
