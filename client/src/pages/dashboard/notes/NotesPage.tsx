import { useState } from 'react'
import { Pencil, Pin, Plus, Trash2 } from 'lucide-react'
import PageHeader from '@/components/dashboard/PageHeader'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { PermissionGate } from '@/features/auth/guards'
import { useNotes, useDeleteNote } from '@/features/notes/queries'
import { getApiErrorMessage } from '@/types/api'
import type { NoteDto } from '@/types/notes'
import NoteFormModal from './NoteFormModal'

export default function NotesPage() {
  const { data: notes, isLoading, isError, error, refetch } = useNotes()
  const del = useDeleteNote()

  const [formOpen, setFormOpen] = useState(false)
  const [editNote, setEditNote] = useState<NoteDto | null>(null)
  const [toDelete, setToDelete] = useState<NoteDto | null>(null)

  // Sabitlenmiş notlar üstte (kararlı sıralama tarih düzenini korur).
  const sorted = [...(notes ?? [])].sort((a, b) => Number(b.pinned) - Number(a.pinned))

  const openCreate = () => {
    setEditNote(null)
    setFormOpen(true)
  }
  const openEdit = (note: NoteDto) => {
    setEditNote(note)
    setFormOpen(true)
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    try {
      await del.mutateAsync(toDelete.id)
      setToDelete(null)
    } catch {
      /* hata toast'lanır */
    }
  }

  return (
    <div>
      <PageHeader
        title="Notlar"
        description="Notlarınızı yönetin."
        actions={
          <PermissionGate permission="notes.create">
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Yeni Not
            </Button>
          </PermissionGate>
        }
      />

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} />
      ) : sorted.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((note) => (
            <div
              key={note.id}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{note.title}</h3>
                {note.pinned && <Pin className="size-4 shrink-0 text-brand-600" />}
              </div>
              {note.content && (
                <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm text-slate-600">
                  {note.content}
                </p>
              )}
              <div className="mt-4 flex justify-end gap-2">
                <PermissionGate permission="notes.update">
                  <Button variant="secondary" onClick={() => openEdit(note)} aria-label="Düzenle">
                    <Pencil className="size-4" />
                  </Button>
                </PermissionGate>
                <PermissionGate permission="notes.delete">
                  <Button variant="danger" onClick={() => setToDelete(note)} aria-label="Sil">
                    <Trash2 className="size-4" />
                  </Button>
                </PermissionGate>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500">Henüz not yok.</p>
      )}

      {formOpen && <NoteFormModal note={editNote} onClose={() => setFormOpen(false)} />}
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Notu sil"
        message={`"${toDelete?.title}" notunu silmek istediğinize emin misiniz?`}
        confirmText="Sil"
        danger
        loading={del.isPending}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}
