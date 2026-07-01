import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import toast from 'react-hot-toast'
import { authApi } from './authApi'
import { tokenStorage } from './tokenStorage'
import { AuthContext, type AuthContextValue, type AuthStatus } from './authContext'
import { setOnUnauthorized } from '@/lib/apiClient'
import type { MeResponse } from '@/types/auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  // 401 kancasının, kapanış sırasında güncel durumu okuyabilmesi için ref.
  const statusRef = useRef<AuthStatus>(status)
  statusRef.current = status

  const applyLoggedOut = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  const loadMe = useCallback(async () => {
    const me = await authApi.me()
    setUser(me)
    setStatus('authenticated')
  }, [])

  // İlk yükleme: httpOnly refresh cookie'den access token üretmeyi dene; başarılıysa
  // oturumu geri yükle, aksi halde anonim. (Access token bellekte olduğundan her
  // sayfa yenilemesinde oturum bu şekilde tazelenir.)
  useEffect(() => {
    let active = true
    async function init() {
      try {
        const tokens = await authApi.refresh()
        tokenStorage.setAccessToken(tokens.accessToken)
        const me = await authApi.me()
        if (active) {
          setUser(me)
          setStatus('authenticated')
        }
      } catch {
        if (active) applyLoggedOut()
      }
    }
    void init()
    return () => {
      active = false
    }
  }, [applyLoggedOut])

  // axios 401 → refresh başarısız olduğunda oturumu düşür. Bu, kullanıcının
  // etkin oturumu beklenmedik şekilde sonlandığında olur; sessizce atmak yerine
  // bilgilendir (ProtectedRoute otomatik olarak /login'e yönlendirir).
  useEffect(() => {
    const handleUnauthorized = () => {
      // Yalnızca etkin bir oturum düştüyse uyar (hiç giriş yapılmamışsa değil).
      if (statusRef.current === 'authenticated') {
        toast.error('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.', { id: 'session-expired' })
      }
      applyLoggedOut()
    }
    setOnUnauthorized(handleUnauthorized)
    return () => setOnUnauthorized(null)
  }, [applyLoggedOut])

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await authApi.login({ email, password })
      tokenStorage.setAccessToken(tokens.accessToken)
      await loadMe()
    },
    [loadMe],
  )

  // Çıkış: sunucuda refresh token'ı iptal et + cookie'yi temizle, sonra yerel durumu sıfırla.
  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Ağ hatası olsa bile yerel oturumu düşürmeye devam et.
    }
    applyLoggedOut()
  }, [applyLoggedOut])

  const value = useMemo<AuthContextValue>(() => {
    const permissions = new Set(user?.permissions ?? [])
    const roles = new Set(user?.roles ?? [])
    return {
      user,
      status,
      login,
      logout,
      refreshMe: loadMe,
      hasPermission: (permission) => permissions.has(permission),
      hasAnyPermission: (list) => list.some((p) => permissions.has(p)),
      hasRole: (role) => roles.has(role),
    }
  }, [user, status, login, logout, loadMe])

  return <AuthContext value={value}>{children}</AuthContext>
}
