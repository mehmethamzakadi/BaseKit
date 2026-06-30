import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-center dark:bg-slate-950">
      <p className="text-5xl font-bold text-brand-600">404</p>
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Sayfa Bulunamadı</h1>
      <Link to="/" className="text-brand-600 hover:underline">
        Anasayfaya dön
      </Link>
    </div>
  )
}
