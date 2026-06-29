import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { notesApi, type NoteInput } from './notesApi'
import { getApiErrorMessage } from '@/types/api'

export const notesKeys = {
  all: ['notes'] as const,
}

export function useNotes() {
  return useQuery({ queryKey: notesKeys.all, queryFn: notesApi.list })
}

export function useCreateNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: NoteInput) => notesApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notesKeys.all })
      toast.success('Not oluşturuldu.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export function useUpdateNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: NoteInput & { id: string }) => notesApi.update(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notesKeys.all })
      toast.success('Not güncellendi.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export function useDeleteNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notesApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notesKeys.all })
      toast.success('Not silindi.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}
