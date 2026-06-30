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
