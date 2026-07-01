/**
 * /auth/login ve /auth/refresh yanıtı. Yalnızca kısa ömürlü access token döner;
 * refresh token güvenlik için httpOnly cookie ile taşınır, gövdede yer almaz.
 */
export interface TokenResponse {
  accessToken: string
  accessTokenExpiresAtUtc: string
}

/** /auth/me yanıtı: kimlik + profil + roller + (anlık) yetkiler. */
export interface MeResponse {
  userId: string | null
  email: string | null
  /** Görünen ad (opsiyonel); yoksa e-posta gösterilir. */
  displayName: string | null
  /** Profil fotoğrafı için geçici (presigned) URL; yoksa null. */
  avatarUrl: string | null
  roles: string[]
  permissions: string[]
}

/** Profil uçlarının ortak yanıtı. */
export interface ProfileResponse {
  email: string | null
  displayName: string | null
  avatarUrl: string | null
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface RegisterResponse {
  id: string
  email: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordResponse {
  message: string
  /** Yalnızca Development ortamında dolu gelir (SMTP yokken kolaylık). */
  resetToken: string | null
}

export interface ResetPasswordRequest {
  email: string
  token: string
  newPassword: string
}

export interface ResetPasswordResponse {
  message: string
}
