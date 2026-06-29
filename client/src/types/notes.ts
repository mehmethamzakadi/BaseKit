export interface NoteDto {
  id: string
  title: string
  content: string | null
  pinned: boolean
  createdAtUtc: string
  updatedAtUtc: string
}
