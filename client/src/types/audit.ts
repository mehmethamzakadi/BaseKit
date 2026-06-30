/** /admin/audit-logs öğesi: tek bir denetim kaydı. */
export interface AuditLogDto {
  id: string
  userId: string | null
  userEmail: string | null
  action: string
  entityType: string | null
  entityId: string | null
  details: string | null
  ipAddress: string | null
  createdAtUtc: string
}
