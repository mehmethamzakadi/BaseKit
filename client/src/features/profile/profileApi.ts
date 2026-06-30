import { apiClient } from '@/lib/apiClient'
import type { ProfileResponse, TokenResponse } from '@/types/auth'

export interface UpdateProfileInput {
  displayName: string | null
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

/** Profil (kendi hesabı) uç noktalarının tiplenmiş sarmalayıcıları. */
export const profileApi = {
  update: (body: UpdateProfileInput) =>
    apiClient.put<ProfileResponse>('/profile', body).then((r) => r.data),

  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post<ProfileResponse>('/profile/avatar', form).then((r) => r.data)
  },

  removeAvatar: () =>
    apiClient.delete<ProfileResponse>('/profile/avatar').then((r) => r.data),

  /**
   * Şifreyi değiştirir. Backend tüm oturumları iptal edip çağıran istemciye
   * yeni token çifti döndürür; bu token'lar saklanarak mevcut oturum sürdürülür.
   */
  changePassword: (body: ChangePasswordInput) =>
    apiClient.post<TokenResponse>('/profile/change-password', body).then((r) => r.data),
}
