import * as Yup from 'yup'

const email = Yup.string()
  .email('Geçerli bir e-posta girin.')
  .required('E-posta zorunlu.')

const password = Yup.string()
  .min(8, 'Şifre en az 8 karakter olmalı.')
  .required('Şifre zorunlu.')

export const loginSchema = Yup.object({
  email,
  password: Yup.string().required('Şifre zorunlu.'),
})

export const registerSchema = Yup.object({
  email,
  password,
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Şifreler eşleşmiyor.')
    .required('Şifre tekrarı zorunlu.'),
})

export const forgotPasswordSchema = Yup.object({ email })

export const resetPasswordSchema = Yup.object({
  newPassword: password,
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Şifreler eşleşmiyor.')
    .required('Şifre tekrarı zorunlu.'),
})
