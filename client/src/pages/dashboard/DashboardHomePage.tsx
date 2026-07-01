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

/** Kompakt bilgi kartı (istatistik / kişisel özet). */
function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
      <span className="rounded-lg bg-brand-50 p-2 text-brand-600 dark:bg-brand-500/10">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="truncate text-lg font-bold text-slate-900 dark:text-slate-50">{value}</p>
      </div>
    </div>
  )
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
    <div className="mx-auto max-w-[1600px] space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Hoş geldin 👋</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">{user?.displayName || user?.email}</p>
      </div>

      {/* Yapay zeka günlük brifing */}
      <AiBriefingWidget coords={coords} />

      {/* Piyasa: Bitcoin + Dolar/TL + Euro/TL */}
      <MarketsWidget />

      {/* Haberler (geniş) + Hava durumu (yan yana, dengeli yükseklik) */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NewsWidget />
        </div>
        <WeatherWidget coords={coords} />
      </div>

      {/* İstatistik + kişisel özet: kompakt şerit */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {canSeeStats &&
          stats?.map((stat) => (
            <InfoCard
              key={stat.key}
              icon={statIcons[stat.icon] ?? Activity}
              label={stat.label}
              value={stat.value.toLocaleString('tr-TR')}
            />
          ))}
        <InfoCard
          icon={ShieldCheck}
          label="Roller"
          value={user?.roles.length ? user.roles.join(', ') : '—'}
        />
        <InfoCard icon={KeyRound} label="Yetki" value={String(user?.permissions.length ?? 0)} />
      </div>

      {/* Hızlı erişim: kompakt */}
      {quickLinks.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Hızlı erişim
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {quickLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-brand-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-brand-500"
              >
                <span className="rounded-lg bg-brand-50 p-2 text-brand-600 dark:bg-brand-500/10">
                  <item.icon className="size-4" />
                </span>
                <span className="truncate text-sm font-medium text-slate-700 group-hover:text-brand-700 dark:text-slate-200">
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
