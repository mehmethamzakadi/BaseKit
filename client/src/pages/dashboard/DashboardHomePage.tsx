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
import { navGroups } from '@/config/navigation'

const statIcons: Record<string, LucideIcon> = {
  users: Users,
  'user-check': UserCheck,
  shield: Shield,
  package: Package,
}

export default function DashboardHomePage() {
  const { user, hasPermission } = useAuth()
  const canSeeStats = hasPermission('admin.view')
  const { data: stats, isLoading: statsLoading } = useStats(canSeeStats)

  const quickLinks = navGroups
    .flatMap((group) => group.items)
    .filter((item) => item.permission && hasPermission(item.permission))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Hoş geldin 👋</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">{user?.displayName || user?.email}</p>
      </div>

      {/* Modül özet istatistikleri (yetkiye bağlı) */}
      {canSeeStats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                />
              ))
            : stats?.map((stat) => {
                const Icon = statIcons[stat.icon] ?? Activity
                return (
                  <div
                    key={stat.key}
                    className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <span className="rounded-lg bg-brand-50 p-3 text-brand-600 dark:bg-brand-500/10">
                      <Icon className="size-6" />
                    </span>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                        {stat.value.toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                )
              })}
        </div>
      )}

      {/* Kişisel özet */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <span className="rounded-lg bg-brand-50 p-3 text-brand-600 dark:bg-brand-500/10">
            <ShieldCheck className="size-6" />
          </span>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Rolleriniz</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {user?.roles.length ? user.roles.join(', ') : '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <span className="rounded-lg bg-brand-50 p-3 text-brand-600 dark:bg-brand-500/10">
            <KeyRound className="size-6" />
          </span>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Yetki sayınız</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {user?.permissions.length ?? 0}
            </p>
          </div>
        </div>
      </div>

      {quickLinks.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Hızlı erişim
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
