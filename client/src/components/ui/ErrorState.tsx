interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

/** Sorgu/işlem hatası için tutarlı gösterim. */
export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 font-medium underline hover:no-underline"
        >
          Tekrar dene
        </button>
      )}
    </div>
  )
}
