import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Form, Formik } from 'formik'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import TextField from '@/components/ui/TextField'
import TextAreaField from '@/components/ui/TextAreaField'
import { PermissionGate } from '@/features/auth/guards'
import { productSchema } from '@/features/catalog/validation'
import {
  useCreateProduct,
  useUpdateProduct,
  useUploadProductImage,
} from '@/features/catalog/queries'
import type { ProductDto } from '@/types/catalog'

interface Props {
  product?: ProductDto | null
  onClose: () => void
}

export default function ProductFormModal({ product, onClose }: Props) {
  const isEdit = Boolean(product)
  const create = useCreateProduct()
  const update = useUpdateProduct()
  const upload = useUploadProductImage()
  const pending = create.isPending || update.isPending

  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !product) return
    try {
      const res = await upload.mutateAsync({ id: product.id, file })
      setPreview(res.url)
    } catch {
      /* hata toast'lanır */
    }
  }

  return (
    <Formik
      initialValues={{
        name: product?.name ?? '',
        description: product?.description ?? '',
        price: product?.price ?? '',
      }}
      validationSchema={productSchema}
      onSubmit={async (values) => {
        const body = {
          name: values.name.trim(),
          description: values.description.trim() || null,
          price: Number(values.price),
        }
        try {
          if (isEdit && product) {
            await update.mutateAsync({ id: product.id, ...body })
          } else {
            await create.mutateAsync(body)
          }
          onClose()
        } catch {
          /* hata toast'lanır */
        }
      }}
    >
      {({ submitForm }) => (
        <Modal
          open
          onClose={onClose}
          title={isEdit ? 'Ürünü Düzenle' : 'Yeni Ürün'}
          footer={
            <>
              <Button variant="secondary" onClick={onClose}>
                İptal
              </Button>
              <Button onClick={submitForm} loading={pending}>
                {isEdit ? 'Kaydet' : 'Oluştur'}
              </Button>
            </>
          }
        >
          <Form className="space-y-4">
            <TextField name="name" label="Ürün adı" placeholder="Örn: Kahve" autoFocus />
            <TextAreaField name="description" label="Açıklama (opsiyonel)" />
            <TextField name="price" label="Fiyat (₺)" type="number" step="0.01" min="0" placeholder="0,00" />
          </Form>

          <div className="mt-5 border-t border-slate-200 pt-4">
            <p className="mb-2 text-sm font-medium text-slate-700">Ürün görseli</p>
            {isEdit ? (
              <PermissionGate
                permission="catalog.products.update"
                fallback={<p className="text-xs text-slate-400">Görsel yükleme yetkiniz yok.</p>}
              >
                {(preview ?? product?.imageUrl) ? (
                  <img
                    src={preview ?? product?.imageUrl ?? ''}
                    alt="Ürün görseli"
                    className="mb-3 size-32 rounded-lg border border-slate-200 object-cover"
                  />
                ) : (
                  <p className="mb-3 text-xs text-slate-500">Bu ürünün henüz görseli yok.</p>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={onFile}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileRef.current?.click()}
                  loading={upload.isPending}
                >
                  Görsel seç
                </Button>
              </PermissionGate>
            ) : (
              <p className="text-xs text-slate-400">
                Ürünü kaydettikten sonra düzenleyerek görsel ekleyebilirsiniz.
              </p>
            )}
          </div>
        </Modal>
      )}
    </Formik>
  )
}
