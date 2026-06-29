import { useState } from 'react'
import { Form, Formik } from 'formik'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthLayout from '@/components/auth/AuthLayout'
import TextField from '@/components/ui/TextField'
import Button from '@/components/ui/Button'
import { forgotPasswordSchema } from '@/features/auth/validation'
import { authApi } from '@/features/auth/authApi'
import { getApiErrorMessage } from '@/types/api'

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null)
  const [devResetLink, setDevResetLink] = useState<string | null>(null)

  return (
    <AuthLayout
      title="Şifremi Unuttum"
      subtitle="E-postanızı girin, sıfırlama talimatlarını gönderelim"
      footer={
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Girişe dön
        </Link>
      }
    >
      {message ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
            {message}
          </div>
          {devResetLink && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-medium">Geliştirme modu</p>
              <p className="mt-1">
                E-posta servisi henüz yok; sıfırlama bağlantısı doğrudan burada:
              </p>
              <Link
                to={devResetLink}
                className="mt-2 inline-block font-medium text-brand-600 hover:underline"
              >
                Şifreyi sıfırla →
              </Link>
            </div>
          )}
        </div>
      ) : (
        <Formik
          initialValues={{ email: '' }}
          validationSchema={forgotPasswordSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              const res = await authApi.forgotPassword({ email: values.email })
              setMessage(res.message)
              if (res.resetToken) {
                const params = new URLSearchParams({
                  email: values.email,
                  token: res.resetToken,
                })
                setDevResetLink(`/reset-password?${params.toString()}`)
              }
            } catch (error) {
              toast.error(getApiErrorMessage(error))
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
              <Button type="submit" loading={isSubmitting} className="w-full">
                Sıfırlama Bağlantısı Gönder
              </Button>
            </Form>
          )}
        </Formik>
      )}
    </AuthLayout>
  )
}
