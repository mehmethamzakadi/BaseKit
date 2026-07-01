/**
 * Access token saklama — yalnızca **bellekte** (JS değişkeni) tutulur.
 *
 * Güvenlik: Kısa ömürlü access token localStorage yerine bellekte tutulur;
 * böylece kalıcı bir XSS hedefi oluşmaz ve sekme kapanınca kaybolur. Kalıcı
 * oturum, httpOnly cookie'deki refresh token ile sağlanır: uygulama açılışında
 * `/auth/refresh` çağrısı cookie'den yeni bir access token üretir
 * (bkz. AuthProvider ve apiClient).
 */
let accessToken: string | null = null

export const tokenStorage = {
  getAccessToken: (): string | null => accessToken,

  setAccessToken: (token: string): void => {
    accessToken = token
  },

  clear: (): void => {
    accessToken = null
  },

  hasToken: (): boolean => accessToken !== null,
}
