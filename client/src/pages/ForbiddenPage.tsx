import { Link } from 'react-router-dom'

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center">
      <p className="text-5xl font-bold text-brand-600">403</p>
      <h1 className="text-2xl font-semibold text-slate-900">Yetkisiz Erişim</h1>
      <p className="text-slate-500">Bu sayfayı görüntüleme yetkiniz yok.</p>
      <Link to="/dashboard" className="text-brand-600 hover:underline">
        Kontrol paneline dön
      </Link>
    </div>
  )
}
