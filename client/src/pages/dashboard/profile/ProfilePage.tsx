import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Form, Formik } from 'formik'
import { Trash2, Upload } from 'lucide-react'
import PageHeader from '@/components/dashboard/PageHeader'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import TextField from '@/components/ui/TextField'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useAuth } from '@/features/auth/useAuth'
import {
  useChangePassword,
  useRemoveAvatar,
  useUpdateProfile,
  useUploadAvatar,
} from '@/features/profile/queries'
import { changePasswordSchema, profileSchema } from '@/features/profile/validation'

export default function ProfilePage() {
  const { user } = useAuth()
  const updateProfile = useUpdateProfile()
  const uploadAvatar = useUploadAvatar()
  const removeAvatar = useRemoveAvatar()
  const changePassword = useChangePassword()

  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const displayLabel = user?.displayName || user?.email || 'Kullanıcı'

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await uploadAvatar.mutateAsync(file).catch(() => {})
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Profilim" description="Hesap bilgilerinizi ve şifrenizi yönetin." />

      <div className="space-y-6">
        {/* --- Profil fotoğrafı + temel bilgiler --- */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-5">
            <Avatar src={user?.avatarUrl} name={displayLabel} size={80} className="text-2xl" />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">{displayLabel}</p>
              <p className="truncate text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {user?.roles.length ? (
                  user.roles.map((role) => (
                    <Badge key={role} color="brand">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">Rol yok</span>
                )}
              </div>
            </div>
            <div className="ml-auto flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={onFile}
                className="hidden"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileRef.current?.click()}
                loading={uploadAvatar.isPending}
              >
                <Upload className="size-4" />
                Fotoğraf yükle
              </Button>
              {user?.avatarUrl && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => setConfirmRemove(true)}
                  aria-label="Fotoğrafı kaldır"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </div>

          <hr className="my-6 border-slate-100 dark:border-slate-800" />

          <Formik
            initialValues={{ displayName: user?.displayName ?? '' }}
            validationSchema={profileSchema}
            enableReinitialize
            onSubmit={async (values) => {
              await updateProfile
                .mutateAsync({ displayName: values.displayName.trim() || null })
                .catch(() => {})
            }}
          >
            {({ submitForm }) => (
              <Form className="space-y-4">
                <TextField
                  name="displayName"
                  label="Görünen ad"
                  placeholder="Örn: Ahmet Yılmaz"
                />
                <div className="flex justify-end">
                  <Button type="button" onClick={submitForm} loading={updateProfile.isPending}>
                    Kaydet
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </section>

        {/* --- Şifre değiştirme --- */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Şifre değiştir</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Güvenliğiniz için güçlü ve benzersiz bir şifre kullanın.
          </p>

          <Formik
            initialValues={{ currentPassword: '', newPassword: '', confirmPassword: '' }}
            validationSchema={changePasswordSchema}
            onSubmit={async (values, { resetForm }) => {
              try {
                await changePassword.mutateAsync({
                  currentPassword: values.currentPassword,
                  newPassword: values.newPassword,
                })
                resetForm()
              } catch {
                /* hata toast'lanır */
              }
            }}
          >
            {({ submitForm }) => (
              <Form className="mt-4 space-y-4">
                <TextField
                  name="currentPassword"
                  label="Mevcut şifre"
                  type="password"
                  autoComplete="current-password"
                />
                <TextField
                  name="newPassword"
                  label="Yeni şifre"
                  type="password"
                  autoComplete="new-password"
                />
                <TextField
                  name="confirmPassword"
                  label="Yeni şifre (tekrar)"
                  type="password"
                  autoComplete="new-password"
                />
                <div className="flex justify-end">
                  <Button type="button" onClick={submitForm} loading={changePassword.isPending}>
                    Şifreyi güncelle
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </section>
      </div>

      <ConfirmDialog
        open={confirmRemove}
        title="Profil fotoğrafını kaldır"
        message="Profil fotoğrafınızı kaldırmak istediğinize emin misiniz?"
        confirmText="Kaldır"
        danger
        loading={removeAvatar.isPending}
        onConfirm={async () => {
          await removeAvatar.mutateAsync().catch(() => {})
          setConfirmRemove(false)
        }}
        onClose={() => setConfirmRemove(false)}
      />
    </div>
  )
}
