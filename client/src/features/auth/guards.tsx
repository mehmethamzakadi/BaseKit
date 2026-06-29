import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './useAuth'
import FullPageSpinner from '@/components/FullPageSpinner'

/**
 * Kimlik doğrulaması (ve isteğe bağlı bir yetki) gerektiren rota grubu.
 * Layout rotası olarak kullanılır; alt rotaları <Outlet/> ile render eder.
 */
export function ProtectedRoute({ permission }: { permission?: string }) {
  const { status, hasPermission } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <FullPageSpinner />
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/403" replace />
  }
  return <Outlet />
}

/**
 * Yalnızca anonim kullanıcılar için (login, register vb.). Oturum açıksa
 * dashboard'a yönlendirir.
 */
export function PublicOnlyRoute() {
  const { status } = useAuth()

  if (status === 'loading') return <FullPageSpinner />
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />
  return <Outlet />
}

/**
 * Belirli bir yetki yoksa içeriği (örn. bir buton) gizler. Menü/aksiyon
 * göster-gizle için kullanılır.
 */
export function PermissionGate({
  permission,
  children,
  fallback = null,
}: {
  permission: string
  children: ReactNode
  fallback?: ReactNode
}) {
  const { hasPermission } = useAuth()
  return <>{hasPermission(permission) ? children : fallback}</>
}
