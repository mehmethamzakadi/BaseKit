import * as Yup from 'yup'

export const roleSchema = Yup.object({
  name: Yup.string().trim().min(2, 'En az 2 karakter.').required('Rol adı zorunlu.'),
  description: Yup.string().max(200, 'En fazla 200 karakter.'),
})
