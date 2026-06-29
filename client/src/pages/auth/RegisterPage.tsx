import { Form, Formik } from 'formik'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthLayout from '@/components/auth/AuthLayout'
import TextField from '@/components/ui/TextField'
import Button from '@/components/ui/Button'
import { registerSchema } from '@/features/auth/validation'
import { authApi } from '@/features/auth/authApi'
import { useAuth } from '@/features/auth/useAuth'
import { getApiErrorMessage } from '@/types/api'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  return (
    <AuthLayout
      title="Kayıt Ol"
      subtitle="Yeni bir hesap oluşturun"
      footer={
        <>
          Zaten hesabınız var mı?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Giriş yapın
          </Link>
        </>
      }
    >
      <Formik
        initialValues={{ email: '', password: '', confirmPassword: '' }}
        validationSchema={registerSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            await authApi.register({ email: values.email, password: values.password })
            // Kayıt sonrası otomatik giriş.
            await login(values.email, values.password)
            toast.success('Hesabınız oluşturuldu.')
            navigate('/dashboard', { replace: true })
          } catch (error) {
            toast.error(getApiErrorMessage(error, 'Kayıt başarısız oldu.'))
          } finally {
            setSubmitting(false)
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4" noValidate>
            <TextField
              name="email"
              label="E-posta"
              type="email"
              autoComplete="email"
              placeholder="ornek@site.com"
            />
            <TextField
              name="password"
              label="Şifre"
              type="password"
              autoComplete="new-password"
              placeholder="En az 8 karakter"
            />
            <TextField
              name="confirmPassword"
              label="Şifre (tekrar)"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
            />
            <Button type="submit" loading={isSubmitting} className="w-full">
              Kayıt Ol
            </Button>
          </Form>
        )}
      </Formik>
    </AuthLayout>
  )
}
