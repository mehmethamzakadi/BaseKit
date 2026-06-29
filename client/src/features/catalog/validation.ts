import * as Yup from 'yup'

export const productSchema = Yup.object({
  name: Yup.string().trim().min(2, 'En az 2 karakter.').required('Ürün adı zorunlu.'),
  description: Yup.string().max(1000, 'En fazla 1000 karakter.'),
  price: Yup.number()
    .typeError('Geçerli bir fiyat girin.')
    .min(0, 'Fiyat negatif olamaz.')
    .required('Fiyat zorunlu.'),
})
