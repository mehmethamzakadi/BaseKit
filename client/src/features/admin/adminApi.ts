import { apiClient } from '@/lib/apiClient'
import type { PagedQuery, PagedResult } from '@/types/api'
import type { PermissionGroupDto, RoleDto, UserDto } from '@/types/admin'

/** Yönetim (RBAC) uç noktalarının tiplenmiş sarmalayıcıları. */
export const adminApi = {
  // --- Kullanıcılar ---
  listUsers: (params: PagedQuery = {}) =>
    apiClient.get<PagedResult<UserDto>>('/admin/users', { params }).then((r) => r.data),

  assignUserRoles: (id: string, roles: string[]) =>
    apiClient.put<UserDto>(`/admin/users/${id}/roles`, { roles }).then((r) => r.data),

  // --- Roller ---
  listRoles: (params: PagedQuery = {}) =>
    apiClient.get<PagedResult<RoleDto>>('/admin/roles', { params }).then((r) => r.data),

  createRole: (body: { name: string; description?: string | null }) =>
    apiClient.post<RoleDto>('/admin/roles', body).then((r) => r.data),

  updateRole: (id: string, body: { name: string; description?: string | null }) =>
    apiClient.put<RoleDto>(`/admin/roles/${id}`, body).then((r) => r.data),

  deleteRole: (id: string) =>
    apiClient.delete<void>(`/admin/roles/${id}`).then((r) => r.data),

  setRolePermissions: (id: string, permissions: string[]) =>
    apiClient
      .put<RoleDto>(`/admin/roles/${id}/permissions`, { permissions })
      .then((r) => r.data),

  // --- Yetki kataloğu ---
  listPermissions: () =>
    apiClient.get<PermissionGroupDto[]>('/admin/permissions').then((r) => r.data),
}
