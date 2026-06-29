import { useContext } from 'react'
import { AuthContext } from './authContext'

/** Auth bağlamına erişim. AuthProvider dışında çağrılırsa hata fırlatır. */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === null) {
    throw new Error('useAuth, <AuthProvider> içinde kullanılmalıdır.')
  }
  return ctx
}
