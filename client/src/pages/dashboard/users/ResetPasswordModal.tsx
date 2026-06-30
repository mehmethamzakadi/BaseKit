import { Form, Formik } from 'formik'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import TextField from '@/components/ui/TextField'
import { useAdminResetPassword } from '@/features/admin/queries'
import { adminResetPasswordSchema } from '@/features/admin/validation'
import type { UserDto } from '@/types/admin'

interface Props {
  user: UserDto
  onClose: () => void
}

export default function ResetPasswordModal({ user, onClose }: Props) {
  const reset = useAdminResetPassword()

  return (
    <Formik
      initialValues={{ newPassword: '' }}
      validationSchema={adminResetPasswordSchema}
      onSubmit={async (values) => {
        try {
          await reset.mutateAsync({ id: user.id, newPassword: values.newPassword })
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
          title={`Şifre sıfırla — ${user.displayName || user.email}`}
          footer={
            <>
              <Button variant="secondary" onClick={onClose}>
                İptal
              </Button>
              <Button onClick={submitForm} loading={reset.isPending}>
                Şifreyi sıfırla
              </Button>
            </>
          }
        >
          <Form className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Bu kullanıcı için yeni bir şifre belirleyin. Kullanıcı bu şifreyle giriş yapabilir.
            </p>
            <TextField
              name="newPassword"
              label="Yeni şifre"
              type="password"
              autoComplete="new-password"
              autoFocus
            />
          </Form>
        </Modal>
      )}
    </Formik>
  )
}
