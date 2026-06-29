/** İçerik içi (sayfa kaplamayan) yükleme göstergesi. */
export default function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-10 ${className}`}>
      <div
        className="size-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600"
        role="status"
        aria-label="Yükleniyor"
      />
    </div>
  )
}
