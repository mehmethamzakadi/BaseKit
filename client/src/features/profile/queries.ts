import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  profileApi,
  type ChangePasswordInput,
  type UpdateProfileInput,
} from './profileApi'
import { useAuth } from '@/features/auth/useAuth'
import { tokenStorage } from '@/features/auth/tokenStorage'
import { getApiErrorMessage } from '@/types/api'

/**
 * Profil mutasyonları. Başarıda auth bağlamı (/auth/me) tazelenir; böylece
 * topbar'daki ad/avatar anında güncellenir.
 */
export function useUpdateProfile() {
  const { refreshMe } = useAuth()
  return useMutation({
    mutationFn: (body: UpdateProfileInput) => profileApi.update(body),
    onSuccess: async () => {
      await refreshMe()
      toast.success('Profil güncellendi.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export function useUploadAvatar() {
  const { refreshMe } = useAuth()
  return useMutation({
    mutationFn: (file: File) => profileApi.uploadAvatar(file),
    onSuccess: async () => {
      await refreshMe()
      toast.success('Profil fotoğrafı güncellendi.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export function useRemoveAvatar() {
  const { refreshMe } = useAuth()
  return useMutation({
    mutationFn: () => profileApi.removeAvatar(),
    onSuccess: async () => {
      await refreshMe()
      toast.success('Profil fotoğrafı kaldırıldı.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: ChangePasswordInput) => profileApi.changePassword(body),
    onSuccess: (tokens) => {
      // Backend diğer oturumları iptal edip yeni token çifti döndürür; bu cihazın
      // oturumu kesintisiz sürsün diye yeni token'ları sakla.
      tokenStorage.setTokens(tokens)
      toast.success('Şifreniz güncellendi. Diğer oturumlar sonlandırıldı.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}
