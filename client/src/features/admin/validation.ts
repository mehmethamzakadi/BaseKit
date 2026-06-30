import * as Yup from 'yup'

export const roleSchema = Yup.object({
  name: Yup.string().trim().min(2, 'En az 2 karakter.').required('Rol adı zorunlu.'),
  description: Yup.string().max(200, 'En fazla 200 karakter.'),
})

export const createUserSchema = Yup.object({
  email: Yup.string().email('Geçerli bir e-posta girin.').required('E-posta zorunlu.'),
  password: Yup.string().min(8, 'Şifre en az 8 karakter olmalı.').required('Şifre zorunlu.'),
  displayName: Yup.string().trim().max(100, 'En fazla 100 karakter.'),
})

export const adminResetPasswordSchema = Yup.object({
  newPassword: Yup.string().min(8, 'Yeni şifre en az 8 karakter olmalı.').required('Yeni şifre zorunlu.'),
})
