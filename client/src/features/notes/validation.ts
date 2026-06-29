import * as Yup from 'yup'

export const noteSchema = Yup.object({
  title: Yup.string().trim().min(2, 'En az 2 karakter.').required('Başlık zorunlu.'),
  content: Yup.string().max(4000, 'En fazla 4000 karakter.'),
})
