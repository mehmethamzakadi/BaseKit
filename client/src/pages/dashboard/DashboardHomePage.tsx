import { Link } from 'react-router-dom'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import { navGroups } from '@/config/navigation'

export default function DashboardHomePage() {
  const { user, hasPermission } = useAuth()

  const quickLinks = navGroups
    .flatMap((group) => group.items)
    .filter((item) => item.permission && hasPermission(item.permission))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hoş geldin 👋</h1>
        <p className="mt-1 text-slate-600">{user?.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5">
          <span className="rounded-lg bg-brand-50 p-3 text-brand-600">
            <ShieldCheck className="size-6" />
          </span>
          <div>
            <p className="text-sm text-slate-500">Rolleriniz</p>
            <p className="font-semibold text-slate-900">
              {user?.roles.length ? user.roles.join(', ') : '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5">
          <span className="rounded-lg bg-brand-50 p-3 text-brand-600">
            <KeyRound className="size-6" />
          </span>
          <div>
            <p className="text-sm text-slate-500">Yetki sayınız</p>
            <p className="font-semibold text-slate-900">{user?.permissions.length ?? 0}</p>
          </div>
        </div>
      </div>

      {quickLinks.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Hızlı erişim
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm"
              >
                <span className="rounded-lg bg-brand-50 p-2 text-brand-600">
                  <item.icon className="size-5" />
                </span>
                <span className="font-medium text-slate-700 group-hover:text-brand-700">
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
