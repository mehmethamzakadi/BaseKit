import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { adminApi } from './adminApi'
import { getApiErrorMessage, type PagedQuery } from '@/types/api'

export const adminKeys = {
  /** Sorgu kökleri — mutasyonlardan (prefix eşleşmeli) toplu invalidate için. */
  users: ['admin', 'users'] as const,
  roles: ['admin', 'roles'] as const,
  permissions: ['admin', 'permissions'] as const,
  usersList: (params: PagedQuery) => ['admin', 'users', 'list', params] as const,
  rolesList: (params: PagedQuery) => ['admin', 'roles', 'list', params] as const,
  auditList: (params: PagedQuery) => ['admin', 'audit', 'list', params] as const,
}

export function useAuditLogs(params: PagedQuery) {
  return useQuery({
    queryKey: adminKeys.auditList(params),
    queryFn: () => adminApi.listAuditLogs(params),
    placeholderData: keepPreviousData,
  })
}

// --- Sorgular ---
export function useUsers(params: PagedQuery) {
  return useQuery({
    queryKey: adminKeys.usersList(params),
    queryFn: () => adminApi.listUsers(params),
    placeholderData: keepPreviousData,
  })
}

export function useRoles(params: PagedQuery = {}) {
  return useQuery({
    queryKey: adminKeys.rolesList(params),
    queryFn: () => adminApi.listRoles(params),
    placeholderData: keepPreviousData,
  })
}

export function usePermissions() {
  return useQuery({ queryKey: adminKeys.permissions, queryFn: adminApi.listPermissions })
}

// --- Mutasyonlar ---
export function useAssignUserRoles() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, roles }: { id: string; roles: string[] }) =>
      adminApi.assignUserRoles(id, roles),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.users })
      toast.success('Roller güncellendi.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { email: string; password: string; displayName?: string | null; roles?: string[] }) =>
      adminApi.createUser(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.users })
      toast.success('Kullanıcı oluşturuldu.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.users })
      toast.success('Kullanıcı silindi.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export function useSetUserActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      adminApi.setUserActive(id, active),
    // Başarı bildirimi (geri-al düğmesiyle) çağıran sayfada gösterilir.
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.users })
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

/** Birden çok kullanıcıyı topluca aktif/pasif yapar; tek özet bildirim gösterir. */
export function useBulkSetUserActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ ids, active }: { ids: string[]; active: boolean }) => {
      const results = await Promise.allSettled(ids.map((id) => adminApi.setUserActive(id, active)))
      const failed = results.filter((r) => r.status === 'rejected').length
      return { total: ids.length, failed, active }
    },
    onSuccess: ({ total, failed, active }) => {
      void qc.invalidateQueries({ queryKey: adminKeys.users })
      const done = total - failed
      const verb = active ? 'aktifleştirildi' : 'pasifleştirildi'
      if (failed === 0) toast.success(`${done} kullanıcı ${verb}.`)
      else toast.error(`${done} kullanıcı ${verb}, ${failed} işlem başarısız.`)
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

/** Birden çok kullanıcıyı topluca siler; tek özet bildirim gösterir. */
export function useBulkDeleteUsers() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map((id) => adminApi.deleteUser(id)))
      const failed = results.filter((r) => r.status === 'rejected').length
      return { total: ids.length, failed }
    },
    onSuccess: ({ total, failed }) => {
      void qc.invalidateQueries({ queryKey: adminKeys.users })
      const done = total - failed
      if (failed === 0) toast.success(`${done} kullanıcı silindi.`)
      else toast.error(`${done} kullanıcı silindi, ${failed} işlem başarısız.`)
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export function useAdminResetPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      adminApi.adminResetPassword(id, newPassword),
    onSuccess: () => toast.success('Kullanıcının şifresi güncellendi.'),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export function useCreateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { name: string; description?: string | null }) =>
      adminApi.createRole(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.roles })
      toast.success('Rol oluşturuldu.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export function useUpdateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; name: string; description?: string | null }) =>
      adminApi.updateRole(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.roles })
      toast.success('Rol güncellendi.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export function useDeleteRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteRole(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.roles })
      toast.success('Rol silindi.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export function useSetRolePermissions() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: string[] }) =>
      adminApi.setRolePermissions(id, permissions),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.roles })
      toast.success('Yetkiler güncellendi.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}
