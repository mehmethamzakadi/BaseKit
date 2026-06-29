import { Form, Formik } from 'formik'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthLayout from '@/components/auth/AuthLayout'
import TextField from '@/components/ui/TextField'
import Button from '@/components/ui/Button'
import { resetPasswordSchema } from '@/features/auth/validation'
import { authApi } from '@/features/auth/authApi'
import { getApiErrorMessage } from '@/types/api'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const token = searchParams.get('token') ?? ''

  const linkValid = email !== '' && token !== ''

  return (
    <AuthLayout
      title="Şifre Sıfırla"
      subtitle={linkValid ? email : undefined}
      footer={
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Girişe dön
        </Link>
      }
    >
      {!linkValid ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            Sıfırlama bağlantısı geçersiz veya eksik.
          </div>
          <Link
            to="/forgot-password"
            className="inline-block font-medium text-brand-600 hover:underline"
          >
            Yeni bağlantı iste →
          </Link>
        </div>
      ) : (
        <Formik
          initialValues={{ newPassword: '', confirmPassword: '' }}
          validationSchema={resetPasswordSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              await authApi.resetPassword({
                email,
                token,
                newPassword: values.newPassword,
              })
              toast.success('Şifreniz güncellendi. Giriş yapabilirsiniz.')
              navigate('/login', { replace: true })
            } catch (error) {
              toast.error(getApiErrorMessage(error, 'Sıfırlama başarısız oldu.'))
            } finally {
              setSubmitting(false)
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4" noValidate>
              <TextField
                name="newPassword"
                label="Yeni Şifre"
                type="password"
                autoComplete="new-password"
                placeholder="En az 8 karakter"
              />
              <TextField
                name="confirmPassword"
                label="Yeni Şifre (tekrar)"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
              />
              <Button type="submit" loading={isSubmitting} className="w-full">
                Şifreyi Güncelle
              </Button>
            </Form>
          )}
        </Formik>
      )}
    </AuthLayout>
  )
}
