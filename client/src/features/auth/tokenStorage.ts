import type { TokenResponse } from '@/types/auth'

/**
 * Token saklama. Access + refresh token'ları localStorage'da tutar.
 *
 * Güvenlik notu: localStorage XSS'e açıktır. Üretim sertleştirmesi için ideal
 * olan refresh token'ı httpOnly cookie'de tutmaktır; ancak mevcut backend
 * refresh token'ı yanıt gövdesinde döndürdüğü için client tarafında saklanması
 * gerekiyor. Tek nokta burası olduğundan ileride cookie'ye taşımak kolaydır.
 */
const ACCESS_KEY = 'basekit.accessToken'
const REFRESH_KEY = 'basekit.refreshToken'

export const tokenStorage = {
  getAccessToken: (): string | null => localStorage.getItem(ACCESS_KEY),
  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_KEY),

  setTokens: (tokens: TokenResponse): void => {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken)
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken)
  },

  clear: (): void => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },

  hasTokens: (): boolean => localStorage.getItem(ACCESS_KEY) !== null,
}
