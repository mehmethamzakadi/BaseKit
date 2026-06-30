import { Form, Formik } from 'formik'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import TextField from '@/components/ui/TextField'
import { roleSchema } from '@/features/admin/validation'
import { useCreateRole, useUpdateRole } from '@/features/admin/queries'
import { getApiFieldErrors } from '@/types/api'
import type { RoleDto } from '@/types/admin'

interface Props {
  /** Verilirse düzenleme, yoksa oluşturma modu. */
  role?: RoleDto | null
  onClose: () => void
}

export default function RoleFormModal({ role, onClose }: Props) {
  const isEdit = Boolean(role)
  const create = useCreateRole()
  const update = useUpdateRole()
  const pending = create.isPending || update.isPending

  return (
    <Formik
      initialValues={{ name: role?.name ?? '', description: role?.description ?? '' }}
      validationSchema={roleSchema}
      onSubmit={async (values, { setErrors }) => {
        const body = {
          name: values.name.trim(),
          description: values.description.trim() || null,
        }
        try {
          if (isEdit && role) {
            await update.mutateAsync({ id: role.id, ...body })
          } else {
            await create.mutateAsync(body)
          }
          onClose()
        } catch (error) {
          // Genel hata mutasyonda toast'lanır; alan hatalarını alanlara bağla.
          const fieldErrors = getApiFieldErrors(error)
          if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors)
        }
      }}
    >
      {({ submitForm }) => (
        <Modal
          open
          onClose={onClose}
          title={isEdit ? 'Rolü Düzenle' : 'Yeni Rol'}
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
            <TextField name="name" label="Rol adı" placeholder="Örn: Editör" autoFocus />
            <TextField
              name="description"
              label="Açıklama (opsiyonel)"
              placeholder="Kısa bir açıklama"
            />
          </Form>
        </Modal>
      )}
    </Formik>
  )
}
