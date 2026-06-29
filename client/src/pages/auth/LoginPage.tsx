import { Form, Formik } from 'formik'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthLayout from '@/components/auth/AuthLayout'
import TextField from '@/components/ui/TextField'
import Button from '@/components/ui/Button'
import { loginSchema } from '@/features/auth/validation'
import { useAuth } from '@/features/auth/useAuth'
import { getApiErrorMessage } from '@/types/api'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  return (
    <AuthLayout
      title="Giriş Yap"
      subtitle="Hesabınıza erişin"
      footer={
        <>
          Hesabınız yok mu?{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:underline">
            Kayıt olun
          </Link>
        </>
      }
    >
      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={loginSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            await login(values.email, values.password)
            toast.success('Giriş başarılı.')
            navigate(from, { replace: true })
          } catch (error) {
            toast.error(getApiErrorMessage(error, 'E-posta veya şifre hatalı.'))
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
              autoComplete="current-password"
              placeholder="••••••••"
            />
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-brand-600 hover:underline"
              >
                Şifremi unuttum
              </Link>
            </div>
            <Button type="submit" loading={isSubmitting} className="w-full">
              Giriş Yap
            </Button>
          </Form>
        )}
      </Formik>
    </AuthLayout>
  )
}
