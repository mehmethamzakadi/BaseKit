import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, UserCog } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import ThemeToggle from '@/components/ui/ThemeToggle'
import NotificationBell from '@/components/dashboard/NotificationBell'
import { useAuth } from '@/features/auth/useAuth'

interface TopbarProps {
  onMenuClick: () => void
  /** Masaüstü kenar çubuğunu daralt/genişlet. */
  onToggleCollapse: () => void
  collapsed: boolean
  /** Komut paletini (⌘K) aç. */
  onOpenCommand: () => void
}

export default function Topbar({ onMenuClick, onToggleCollapse, collapsed, onOpenCommand }: TopbarProps) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const displayLabel = user?.displayName || user?.email || 'Kullanıcı'

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 md:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-md p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
        aria-label="Menüyü aç"
      >
        <Menu className="size-5" />
      </button>

      {/* Masaüstü: kenar çubuğu daralt/genişlet */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className="hidden rounded-md p-2 text-slate-600 hover:bg-slate-100 md:inline-flex dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label={collapsed ? 'Kenar çubuğunu genişlet' : 'Kenar çubuğunu daralt'}
        title={collapsed ? 'Kenar çubuğunu genişlet' : 'Kenar çubuğunu daralt'}
      >
        {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
      </button>

      {/* Komut paleti tetikleyici — ortada, geniş arama alanı görünümü */}
      <div className="hidden flex-1 justify-center px-2 sm:flex">
        <button
          type="button"
          onClick={onOpenCommand}
          className="flex w-full max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-400 transition hover:border-brand-300 hover:bg-white hover:text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-brand-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          aria-label="Ara (komut paleti)"
        >
          <Search className="size-4 shrink-0" />
          <span>Ara...</span>
          <kbd className="ml-auto rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="ml-auto flex items-center gap-1">
        {/* Mobil arama (yalnızca ikon) */}
        <button
          type="button"
          onClick={onOpenCommand}
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100 sm:hidden dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Ara"
        >
          <Search className="size-5" />
        </button>
        <NotificationBell />
        <ThemeToggle />

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Avatar src={user?.avatarUrl} name={displayLabel} size={32} className="text-sm" />
            <span className="hidden max-w-[180px] truncate text-sm font-medium text-slate-700 dark:text-slate-200 sm:block">
              {displayLabel}
            </span>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden />
              <div className="absolute right-0 z-20 mt-2 w-60 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-700">
                  <Avatar src={user?.avatarUrl} name={displayLabel} size={36} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {displayLabel}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                  </div>
                </div>
                <Link
                  to="/dashboard/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50"
                >
                  <UserCog className="size-4" />
                  Profilim
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 transition hover:bg-slate-50 dark:text-red-400 dark:hover:bg-slate-700/50"
                >
                  <LogOut className="size-4" />
                  Çıkış yap
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
