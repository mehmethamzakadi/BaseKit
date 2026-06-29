import { createContext } from 'react'
import type { MeResponse } from '@/types/auth'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthContextValue {
  user: MeResponse | null
  status: AuthStatus
  /** E-posta + şifre ile giriş yapar, token'ları saklar ve kullanıcıyı yükler. */
  login: (email: string, password: string) => Promise<void>
  /** Token'ları temizler ve oturumu kapatır. */
  logout: () => void
  /** /auth/me'yi yeniden çağırarak rol/yetkileri tazeler. */
  refreshMe: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasRole: (role: string) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)
