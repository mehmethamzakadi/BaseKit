import { useState } from 'react'
import { Form, Formik } from 'formik'
import toast from 'react-hot-toast'
import { Search, X, Check } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import TextField from '@/components/ui/TextField'
import TextAreaField from '@/components/ui/TextAreaField'
import { useBroadcastNotification, useRecipients } from '@/features/notifications/queries'
import { broadcastSchema } from '@/features/notifications/validation'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import type { NotificationType, RecipientDto } from '@/types/notifications'

interface Props {
  onClose: () => void
}

type Target = 'all' | 'user'

const typeOptions: { value: NotificationType; label: string }[] = [
  { value: 'info', label: 'Bilgi' },
  { value: 'success', label: 'Başarı' },
  { value: 'warning', label: 'Uyarı' },
  { value: 'error', label: 'Hata' },
]

const recipientLabel = (r: RecipientDto) => r.displayName || r.email || r.id

/** Yöneticinin tüm kullanıcılara ya da belirli bir kullanıcıya bildirim göndermesini sağlar. */
export default function BroadcastModal({ onClose }: Props) {
  const broadcast = useBroadcastNotification()

  const [target, setTarget] = useState<Target>('all')
  const [selected, setSelected] = useState<RecipientDto | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput.trim(), 300)

  // Alıcı araması yalnızca "belirli kullanıcı" modunda ve seçim yapılmamışken.
  const { data: recipients, isFetching } = useRecipients(
    search,
    target === 'user' && !selected,
  )

  return (
    <Formik
      initialValues={{ title: '', message: '', type: 'info' as NotificationType, link: '' }}
      validationSchema={broadcastSchema}
      onSubmit={async (values) => {
        if (target === 'user' && !selected) {
          toast.error('Lütfen bir alıcı seçin.')
          return
        }
        try {
          await broadcast.mutateAsync({
            title: values.title.trim(),
            message: values.message.trim(),
            type: values.type,
            link: values.link.trim() || null,
            userId: target === 'user' ? selected!.id : null,
          })
          onClose()
        } catch {
          /* hata toast'lanır */
        }
      }}
    >
      {({ submitForm, values, setFieldValue }) => (
        <Modal
          open
          onClose={onClose}
          title="Bildirim Gönder"
          footer={
            <>
              <Button variant="secondary" onClick={onClose}>
                İptal
              </Button>
              <Button onClick={submitForm} loading={broadcast.isPending}>
                Gönder
              </Button>
            </>
          }
        >
          <Form className="space-y-4">
            {/* Hedef seçimi */}
            <div className="space-y-1">
              <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Hedef
              </span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
                {[
                  { key: 'all' as Target, label: 'Tüm kullanıcılar' },
                  { key: 'user' as Target, label: 'Belirli kullanıcı' },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTarget(t.key)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      target === t.key
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Kullanıcı seçici (yalnızca "belirli kullanıcı") */}
            {target === 'user' && (
              <div className="space-y-1">
                {selected ? (
                  <div className="flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 dark:border-brand-500/40 dark:bg-brand-500/10">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {recipientLabel(selected)}
                      </p>
                      {selected.email && selected.displayName && (
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {selected.email}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-600 dark:hover:bg-slate-800"
                      aria-label="Seçimi temizle"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="E-posta veya ad ile ara..."
                        className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
                      {isFetching ? (
                        <p className="px-3 py-3 text-sm text-slate-400">Aranıyor…</p>
                      ) : (recipients ?? []).length === 0 ? (
                        <p className="px-3 py-3 text-sm text-slate-400">
                          {search ? 'Kullanıcı bulunamadı.' : 'Aramak için yazın.'}
                        </p>
                      ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-slate-700/60">
                          {(recipients ?? []).map((r) => (
                            <li key={r.id}>
                              <button
                                type="button"
                                onClick={() => setSelected(r)}
                                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700/40"
                              >
                                <span className="min-w-0">
                                  <span className="block truncate text-sm text-slate-800 dark:text-slate-100">
                                    {recipientLabel(r)}
                                  </span>
                                  {r.email && r.displayName && (
                                    <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                                      {r.email}
                                    </span>
                                  )}
                                </span>
                                <Check className="size-4 shrink-0 text-transparent" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {target === 'all' && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Bu bildirim tüm aktif kullanıcılara gönderilir ve anlık olarak iletilir.
              </p>
            )}

            <TextField name="title" label="Başlık" autoFocus />
            <TextAreaField name="message" label="Mesaj" rows={4} />

            <div className="space-y-1">
              <label
                htmlFor="type"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Tür
              </label>
              <select
                id="type"
                value={values.type}
                onChange={(e) => setFieldValue('type', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                {typeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <TextField name="link" label="Bağlantı (opsiyonel)" placeholder="/dashboard/users" />
          </Form>
        </Modal>
      )}
    </Formik>
  )
}
