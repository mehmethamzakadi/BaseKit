import { apiClient } from '@/lib/apiClient'
import type { NoteDto } from '@/types/notes'

export interface NoteInput {
  title: string
  content: string | null
  pinned: boolean
}

export const notesApi = {
  list: () => apiClient.get<NoteDto[]>('/notes').then((r) => r.data),

  create: (body: NoteInput) => apiClient.post<NoteDto>('/notes', body).then((r) => r.data),

  update: (id: string, body: NoteInput) =>
    apiClient.put<NoteDto>(`/notes/${id}`, body).then((r) => r.data),

  remove: (id: string) => apiClient.delete<void>(`/notes/${id}`).then((r) => r.data),
}
