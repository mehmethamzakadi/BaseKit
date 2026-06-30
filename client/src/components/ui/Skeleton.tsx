/** Tek bir parıltılı (shimmer) yer tutucu blok. */
export default function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-slate-200 dark:bg-slate-700 ${className}`}
      aria-hidden
    />
  )
}
