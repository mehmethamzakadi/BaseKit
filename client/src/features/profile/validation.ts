import * as Yup from 'yup'

export const profileSchema = Yup.object({
  displayName: Yup.string()
    .trim()
    .max(100, 'Görünen ad en fazla 100 karakter olabilir.'),
})

export const changePasswordSchema = Yup.object({
  currentPassword: Yup.string().required('Mevcut şifre zorunlu.'),
  newPassword: Yup.string()
    .min(8, 'Yeni şifre en az 8 karakter olmalı.')
    .required('Yeni şifre zorunlu.'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Şifreler eşleşmiyor.')
    .required('Şifre tekrarı zorunlu.'),
})
