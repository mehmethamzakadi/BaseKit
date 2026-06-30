import { Form, Formik } from 'formik'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import TextField from '@/components/ui/TextField'
import Spinner from '@/components/ui/Spinner'
import { useCreateUser, useRoles } from '@/features/admin/queries'
import { createUserSchema } from '@/features/admin/validation'

interface Props {
  onClose: () => void
}

export default function UserCreateModal({ onClose }: Props) {
  const create = useCreateUser()
  const { data: rolesPage, isLoading } = useRoles({ pageSize: 100 })
  const roles = rolesPage?.items ?? []

  return (
    <Formik
      initialValues={{ email: '', password: '', displayName: '', roles: [] as string[] }}
      validationSchema={createUserSchema}
      onSubmit={async (values) => {
        try {
          await create.mutateAsync({
            email: values.email.trim(),
            password: values.password,
            displayName: values.displayName.trim() || null,
            roles: values.roles,
          })
          onClose()
        } catch {
          /* hata toast'lanır */
        }
      }}
    >
      {({ submitForm, values, setFieldValue }) => {
        const toggleRole = (name: string) =>
          setFieldValue(
            'roles',
            values.roles.includes(name)
              ? values.roles.filter((r) => r !== name)
              : [...values.roles, name],
          )

        return (
          <Modal
            open
            onClose={onClose}
            title="Yeni Kullanıcı"
            footer={
              <>
                <Button variant="secondary" onClick={onClose}>
                  İptal
                </Button>
                <Button onClick={submitForm} loading={create.isPending}>
                  Oluştur
                </Button>
              </>
            }
          >
            <Form className="space-y-4">
              <TextField name="email" label="E-posta" type="email" autoFocus />
              <TextField name="password" label="Şifre" type="password" autoComplete="new-password" />
              <TextField name="displayName" label="Görünen ad (opsiyonel)" />

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Roller</p>
                {isLoading ? (
                  <Spinner />
                ) : (
                  <div className="space-y-2">
                    {roles.map((role) => (
                      <label
                        key={role.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        <input
                          type="checkbox"
                          checked={values.roles.includes(role.name)}
                          onChange={() => toggleRole(role.name)}
                          className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-200"
                        />
                        <span className="text-sm text-slate-800 dark:text-slate-100">{role.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </Form>
          </Modal>
        )
      }}
    </Formik>
  )
}
