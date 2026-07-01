import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

/** Dashboard yol parçaları için okunur etiketler. */
const LABELS: Record<string, string> = {
  products: 'Katalog',
  users: 'Kullanıcılar',
  roles: 'Roller & Yetkiler',
  audit: 'Denetim Kayıtları',
  settings: 'Sistem Ayarları',
  notifications: 'Bildirimler',
  profile: 'Profilim',
}

/**
 * /dashboard altındaki konumu gösteren breadcrumb. Kök (/dashboard) sayfada
 * gösterilmez; alt sayfalarda "Panel › Sayfa" biçiminde çıkar.
 */
export default function Breadcrumbs() {
  const { pathname } = useLocation()
  const segments = pathname.split('/').filter(Boolean) // ["dashboard", "users", ...]

  // Yalnızca /dashboard'un altındayken ve en az bir alt segment varken göster.
  if (segments[0] !== 'dashboard' || segments.length < 2) return null

  const crumbs = segments.slice(1) // "dashboard" sonrası

  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
      <Link
        to="/dashboard"
        className="flex items-center gap-1 rounded transition hover:text-slate-700 dark:hover:text-slate-200"
      >
        <Home className="size-4" />
        <span>Panel</span>
      </Link>
      {crumbs.map((segment, index) => {
        const isLast = index === crumbs.length - 1
        const label = LABELS[segment] ?? segment
        return (
          <span key={segment} className="flex items-center gap-1.5">
            <ChevronRight className="size-3.5 text-slate-300 dark:text-slate-600" />
            {isLast ? (
              <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
            ) : (
              <span>{label}</span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
