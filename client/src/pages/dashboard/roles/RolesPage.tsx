import { useEffect, useState } from 'react'
import { KeyRound, Pencil, Plus, Trash2 } from 'lucide-react'
import PageHeader from '@/components/dashboard/PageHeader'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import SearchInput from '@/components/ui/SearchInput'
import Pagination from '@/components/ui/Pagination'
import { useRoles, useDeleteRole } from '@/features/admin/queries'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { getApiErrorMessage } from '@/types/api'
import type { RoleDto } from '@/types/admin'
import RoleFormModal from './RoleFormModal'
import RolePermissionsModal from './RolePermissionsModal'

const PAGE_SIZE_OPTIONS = [9, 18, 36]

export default function RolesPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(9)
  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput.trim(), 300)

  useEffect(() => {
    setPage(1)
  }, [search])

  const changePageSize = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  const { data, isLoading, isError, error, refetch, isPlaceholderData } = useRoles({
    page,
    pageSize,
    search: search || undefined,
  })
  const del = useDeleteRole()

  const [formOpen, setFormOpen] = useState(false)
  const [editRole, setEditRole] = useState<RoleDto | null>(null)
  const [permRole, setPermRole] = useState<RoleDto | null>(null)
  const [toDelete, setToDelete] = useState<RoleDto | null>(null)

  const openCreate = () => {
    setEditRole(null)
    setFormOpen(true)
  }
  const openEdit = (role: RoleDto) => {
    setEditRole(role)
    setFormOpen(true)
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    try {
      await del.mutateAsync(toDelete.id)
      setToDelete(null)
    } catch {
      // hata mutasyonda toast'lanır
    }
  }

  const roles = data?.items ?? []
  const hasResults = roles.length > 0

  return (
    <div>
      <PageHeader
        title="Roller & Yetkiler"
        description="Rolleri oluşturun ve yetkilerini düzenleyin."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Yeni Rol
          </Button>
        }
      />

      <div className="mb-4 max-w-sm">
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Rol adı veya açıklamada ara..."
        />
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} />
      ) : hasResults ? (
        <div className={`transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <div
                key={role.id}
                className="flex flex-col rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-900">{role.name}</h3>
                    {role.description && (
                      <p className="mt-0.5 text-sm text-slate-500">{role.description}</p>
                    )}
                  </div>
                  <Badge color="brand">{role.permissions.length} yetki</Badge>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="secondary" onClick={() => setPermRole(role)}>
                    <KeyRound className="size-4" />
                    Yetkiler
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => openEdit(role)}
                    aria-label="Düzenle"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setToDelete(role)}
                    aria-label="Sil"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {data && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white">
              <Pagination
                page={data.page}
                pageSize={data.pageSize}
                totalCount={data.totalCount}
                totalPages={data.totalPages}
                onPageChange={setPage}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                onPageSizeChange={changePageSize}
              />
            </div>
          )}
        </div>
      ) : (
        <p className="text-slate-500">
          {search ? `"${search}" için sonuç bulunamadı.` : 'Henüz rol yok.'}
        </p>
      )}

      {formOpen && (
        <RoleFormModal role={editRole} onClose={() => setFormOpen(false)} />
      )}
      {permRole && (
        <RolePermissionsModal role={permRole} onClose={() => setPermRole(null)} />
      )}
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Rolü sil"
        message={`"${toDelete?.name}" rolünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        danger
        loading={del.isPending}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}
