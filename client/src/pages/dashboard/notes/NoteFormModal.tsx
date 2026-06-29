import { Field, Form, Formik } from 'formik'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import TextField from '@/components/ui/TextField'
import TextAreaField from '@/components/ui/TextAreaField'
import { noteSchema } from '@/features/notes/validation'
import { useCreateNote, useUpdateNote } from '@/features/notes/queries'
import type { NoteDto } from '@/types/notes'

interface Props {
  note?: NoteDto | null
  onClose: () => void
}

export default function NoteFormModal({ note, onClose }: Props) {
  const isEdit = Boolean(note)
  const create = useCreateNote()
  const update = useUpdateNote()
  const pending = create.isPending || update.isPending

  return (
    <Formik
      initialValues={{
        title: note?.title ?? '',
        content: note?.content ?? '',
        pinned: note?.pinned ?? false,
      }}
      validationSchema={noteSchema}
      onSubmit={async (values) => {
        const body = {
          title: values.title.trim(),
          content: values.content.trim() || null,
          pinned: values.pinned,
        }
        try {
          if (isEdit && note) {
            await update.mutateAsync({ id: note.id, ...body })
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
          title={isEdit ? 'Notu Düzenle' : 'Yeni Not'}
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
            <TextField name="title" label="Başlık" placeholder="Not başlığı" autoFocus />
            <TextAreaField name="content" label="İçerik (opsiyonel)" rows={5} />
            <label className="flex cursor-pointer items-center gap-2">
              <Field
                type="checkbox"
                name="pinned"
                className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-200"
              />
              <span className="text-sm text-slate-700">Üste sabitle</span>
            </label>
          </Form>
        </Modal>
      )}
    </Formik>
  )
}
