/** Tüm sayfayı kaplayan yükleme göstergesi (auth durumu çözülürken). */
export default function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div
        className="size-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600"
        role="status"
        aria-label="Yükleniyor"
      />
    </div>
  )
}
