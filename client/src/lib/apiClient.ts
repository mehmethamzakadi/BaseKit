import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/config/env'
import { tokenStorage } from '@/features/auth/tokenStorage'
import type { TokenResponse } from '@/types/auth'

/** Tüm API çağrıları için ortak axios örneği.
 * Content-Type'ı sabitlemiyoruz: axios JSON gövdeler için application/json,
 * FormData (dosya yükleme) için multipart/form-data + boundary'i otomatik ayarlar.
 * withCredentials: httpOnly refresh cookie'sinin gönderilip alınabilmesi için gerekli. */
export const apiClient = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true,
})

// --- İstek interceptor'ı: access token'ı ekle ---
apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// --- 401 oturumu sonlandığında çağrılacak kanca ---
// (AuthContext kayıt olur; döngüsel bağımlılığı önlemek için callback ile.)
let onUnauthorized: (() => void) | null = null
export function setOnUnauthorized(callback: (() => void) | null): void {
  onUnauthorized = callback
}

// --- Tek-uçuşlu (single-flight) refresh: eşzamanlı 401'ler tek yenileme yapar ---
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  try {
    // Refresh token httpOnly cookie'de taşınır → gövde yok, withCredentials ile
    // cookie gönderilir. Interceptor döngüsünü önlemek için çıplak axios kullanılır.
    const { data } = await axios.post<TokenResponse>(
      `${env.apiUrl}/auth/refresh`,
      null,
      { withCredentials: true },
    )
    tokenStorage.setAccessToken(data.accessToken)
    return data.accessToken
  } catch {
    tokenStorage.clear()
    return null
  }
}

// --- Yanıt interceptor'ı: 401'de access token'ı yenileyip isteği tekrarla ---
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined

    const status = error.response?.status
    // Refresh cookie httpOnly olduğundan client'tan okunamaz; 401'de doğrudan
    // yenileme denenir (cookie yoksa /auth/refresh 401 döner → oturum düşer).
    const isAuthCall =
      original?.url?.endsWith('/auth/refresh') === true ||
      original?.url?.endsWith('/auth/login') === true
    const shouldRefresh =
      status === 401 &&
      original != null &&
      original._retry !== true &&
      !isAuthCall

    if (shouldRefresh && original) {
      original._retry = true
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })

      const newToken = await refreshPromise
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`
        return apiClient(original)
      }

      // Yenileme başarısız → oturum düştü.
      onUnauthorized?.()
    }

    return Promise.reject(error)
  },
)
