import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LogOut, Menu, UserCog } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import { useAuth } from '@/features/auth/useAuth'

interface TopbarProps {
  onMenuClick: () => void
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const displayLabel = user?.displayName || user?.email || 'Kullanıcı'

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-slate-200 bg-white px-4 md:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
        aria-label="Menüyü aç"
      >
        <Menu className="size-5" />
      </button>

      <div className="relative ml-auto">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-slate-100"
        >
          <Avatar src={user?.avatarUrl} name={displayLabel} size={32} className="text-sm" />
          <span className="hidden max-w-[180px] truncate text-sm font-medium text-slate-700 sm:block">
            {displayLabel}
          </span>
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden />
            <div className="absolute right-0 z-20 mt-2 w-60 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                <Avatar src={user?.avatarUrl} name={displayLabel} size={36} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{displayLabel}</p>
                  <p className="truncate text-xs text-slate-500">{user?.email}</p>
                </div>
              </div>
              <Link
                to="/dashboard/profile"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <UserCog className="size-4" />
                Profilim
              </Link>
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 transition hover:bg-slate-50"
              >
                <LogOut className="size-4" />
                Çıkış yap
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
