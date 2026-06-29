import { apiClient } from '@/lib/apiClient'
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  MeResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  TokenResponse,
} from '@/types/auth'

/** Kimlik doğrulama uç noktalarının tiplenmiş sarmalayıcıları. */
export const authApi = {
  login: (body: LoginRequest) =>
    apiClient.post<TokenResponse>('/auth/login', body).then((r) => r.data),

  register: (body: RegisterRequest) =>
    apiClient.post<RegisterResponse>('/auth/register', body).then((r) => r.data),

  me: () => apiClient.get<MeResponse>('/auth/me').then((r) => r.data),

  forgotPassword: (body: ForgotPasswordRequest) =>
    apiClient
      .post<ForgotPasswordResponse>('/auth/forgot-password', body)
      .then((r) => r.data),

  resetPassword: (body: ResetPasswordRequest) =>
    apiClient
      .post<ResetPasswordResponse>('/auth/reset-password', body)
      .then((r) => r.data),
}
