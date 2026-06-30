import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { usePublicSettings } from '@/features/settings/usePublicSettings'

export default function HomePage() {
  const { status, user } = useAuth()
  const { siteName } = usePublicSettings()
  const isAuthed = status === 'authenticated'

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
      {/* Navbar */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-xl font-bold text-brand-700 dark:text-brand-400">
          {siteName}
        </Link>
        <nav className="flex items-center gap-3">
          {isAuthed ? (
            <Link
              to="/dashboard"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Kontrol Paneli
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Giriş
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Kayıt Ol
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <span className="mb-4 rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-700">
          Modüler Yönetim Platformu
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
          {siteName}'e hoş geldiniz
        </h1>
        <p className="mt-4 max-w-xl text-lg text-slate-600 dark:text-slate-300">
          Kullanıcıları, rolleri, yetkileri ve modülleri tek bir yönetim
          panelinden güvenle yönetin.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {isAuthed ? (
            <Link
              to="/dashboard"
              className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Panele git
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Hemen başla
              </Link>
              <Link
                to="/login"
                className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Giriş yap
              </Link>
            </>
          )}
        </div>
        {isAuthed && user?.email && (
          <p className="mt-6 text-sm text-slate-500">
            {user.email} olarak giriş yaptınız.
          </p>
        )}
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 py-6 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} {siteName}
      </footer>
    </div>
  )
}
