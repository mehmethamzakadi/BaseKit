import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { authApi } from './authApi'
import { tokenStorage } from './tokenStorage'
import { AuthContext, type AuthContextValue, type AuthStatus } from './authContext'
import { setOnUnauthorized } from '@/lib/apiClient'
import type { MeResponse } from '@/types/auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

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

  // İlk yükleme: token varsa kullanıcıyı getir, yoksa anonim.
  useEffect(() => {
    let active = true
    async function init() {
      if (!tokenStorage.hasTokens()) {
        setStatus('unauthenticated')
        return
      }
      try {
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

  // axios 401 → refresh başarısız olduğunda oturumu düşür.
  useEffect(() => {
    setOnUnauthorized(applyLoggedOut)
    return () => setOnUnauthorized(null)
  }, [applyLoggedOut])

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await authApi.login({ email, password })
      tokenStorage.setTokens(tokens)
      await loadMe()
    },
    [loadMe],
  )

  const value = useMemo<AuthContextValue>(() => {
    const permissions = new Set(user?.permissions ?? [])
    const roles = new Set(user?.roles ?? [])
    return {
      user,
      status,
      login,
      logout: applyLoggedOut,
      refreshMe: loadMe,
      hasPermission: (permission) => permissions.has(permission),
      hasAnyPermission: (list) => list.some((p) => permissions.has(p)),
      hasRole: (role) => roles.has(role),
    }
  }, [user, status, login, applyLoggedOut, loadMe])

  return <AuthContext value={value}>{children}</AuthContext>
}
