import { Link } from 'react-router-dom'
import {
  Activity,
  KeyRound,
  Package,
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import { useStats } from '@/features/dashboard/queries'
import { useGeolocation } from '@/lib/useGeolocation'
import { navGroups } from '@/config/navigation'
import AiBriefingWidget from '@/components/dashboard/insights/AiBriefingWidget'
import WeatherWidget from '@/components/dashboard/insights/WeatherWidget'
import MarketsWidget from '@/components/dashboard/insights/MarketsWidget'
import NewsWidget from '@/components/dashboard/insights/NewsWidget'

const statIcons: Record<string, LucideIcon> = {
  users: Users,
  'user-check': UserCheck,
  shield: Shield,
  package: Package,
}

export default function DashboardHomePage() {
  const { user, hasPermission } = useAuth()
  const canSeeStats = hasPermission('admin.view')
  const { data: stats } = useStats(canSeeStats)
  const { coords } = useGeolocation()

  const quickLinks = navGroups
    .flatMap((group) => group.items)
    .filter((item) => item.permission && hasPermission(item.permission))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Hoş geldin 👋</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">{user?.displayName || user?.email}</p>
      </div>

      {/* Yapay zeka günlük brifing (hava + piyasa + gündem sentezi) */}
      <AiBriefingWidget coords={coords} />

      {/* Piyasa: Bitcoin + Dolar/TL + Euro/TL */}
      <MarketsWidget />

      {/* Ana grid: haberler (geniş) + yan sütun (hava + kişisel özet) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NewsWidget />
        </div>

        <aside className="space-y-6">
          <WeatherWidget coords={coords} />

          {/* Modül istatistikleri (yalnızca yetkili) */}
          {canSeeStats && stats && (
            <div className="grid grid-cols-2 gap-3">
              {stats.map((stat) => {
                const Icon = statIcons[stat.icon] ?? Activity
                return (
                  <div
                    key={stat.key}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <span className="rounded-lg bg-brand-50 p-2 text-brand-600 dark:bg-brand-500/10">
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {stat.label}
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-50">
                        {stat.value.toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Kişisel özet */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
              <span className="rounded-lg bg-brand-50 p-2 text-brand-600 dark:bg-brand-500/10">
                <ShieldCheck className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400">Roller</p>
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {user?.roles.length ? user.roles.join(', ') : '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
              <span className="rounded-lg bg-brand-50 p-2 text-brand-600 dark:bg-brand-500/10">
                <KeyRound className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400">Yetki</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {user?.permissions.length ?? 0}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Hızlı erişim */}
      {quickLinks.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Hızlı erişim
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-brand-500"
              >
                <span className="rounded-lg bg-brand-50 p-2 text-brand-600 dark:bg-brand-500/10">
                  <item.icon className="size-5" />
                </span>
                <span className="font-medium text-slate-700 group-hover:text-brand-700 dark:text-slate-200">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
