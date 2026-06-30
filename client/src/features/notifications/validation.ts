import * as yup from 'yup'

export const broadcastSchema = yup.object({
  title: yup.string().trim().required('Başlık zorunludur.').max(200, 'En fazla 200 karakter.'),
  message: yup.string().trim().required('Mesaj zorunludur.').max(2000, 'En fazla 2000 karakter.'),
  type: yup.string().oneOf(['info', 'success', 'warning', 'error']).required(),
  link: yup.string().trim().max(500, 'En fazla 500 karakter.'),
})
