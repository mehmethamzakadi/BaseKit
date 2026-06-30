import { useEffect, useState } from 'react'
import { KeyRound, Power, Trash2, UserPlus, Users as UsersIcon } from 'lucide-react'
import PageHeader from '@/components/dashboard/PageHeader'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import TableSkeleton from '@/components/ui/TableSkeleton'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import SearchInput from '@/components/ui/SearchInput'
import Pagination from '@/components/ui/Pagination'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useUsers, useDeleteUser, useSetUserActive } from '@/features/admin/queries'
import { useAuth } from '@/features/auth/useAuth'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { usePublicSettings } from '@/features/settings/usePublicSettings'
import { buildPageSizeOptions } from '@/lib/pageSize'
import { getApiErrorMessage } from '@/types/api'
import type { UserDto } from '@/types/admin'
import EditUserRolesModal from './EditUserRolesModal'
import UserCreateModal from './UserCreateModal'
import ResetPasswordModal from './ResetPasswordModal'

const PAGE_SIZE_OPTIONS = [10, 25, 50]

export default function UsersPage() {
  const { user: me } = useAuth()
  const { defaultPageSize } = usePublicSettings()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput.trim(), 300)

  useEffect(() => {
    setPage(1)
  }, [search])

  const changePageSize = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  const { data, isLoading, isError, error, refetch, isPlaceholderData } = useUsers({
    page,
    pageSize,
    search: search || undefined,
  })
  const del = useDeleteUser()
  const setActive = useSetUserActive()

  const [editing, setEditing] = useState<UserDto | null>(null)
  const [resetting, setResetting] = useState<UserDto | null>(null)
  const [toDelete, setToDelete] = useState<UserDto | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const confirmDelete = async () => {
    if (!toDelete) return
    try {
      await del.mutateAsync(toDelete.id)
      setToDelete(null)
    } catch {
      /* hata toast'lanır */
    }
  }

  const users = data?.items ?? []
  const hasResults = users.length > 0

  return (
    <div>
      <PageHeader
        title="Kullanıcılar"
        description="Kullanıcıları, rollerini ve erişimlerini yönetin."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus className="size-4" />
            Yeni Kullanıcı
          </Button>
        }
      />

      <div className="mb-4 max-w-sm">
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Ad veya e-posta ile ara..."
        />
      </div>

      {isLoading ? (
        <TableSkeleton columns={4} />
      ) : isError ? (
        <ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} />
      ) : hasResults ? (
        <div
          className={`overflow-hidden rounded-xl border border-slate-200 bg-white transition-opacity dark:border-slate-700 dark:bg-slate-900 ${
            isPlaceholderData ? 'opacity-60' : ''
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Kullanıcı</th>
                  <th className="px-4 py-3 font-semibold">Roller</th>
                  <th className="px-4 py-3 font-semibold">Durum</th>
                  <th className="px-4 py-3 text-right font-semibold">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((user) => {
                  const isSelf = me?.userId === user.id
                  const label = user.displayName || user.email || 'Kullanıcı'
                  return (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={label} size={36} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-800 dark:text-slate-100">
                              {user.displayName || user.email}
                            </p>
                            {user.displayName && (
                              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                {user.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <Badge key={role} color="brand">
                                {role}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={user.isActive ? 'green' : 'slate'}>
                          {user.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" onClick={() => setEditing(user)}>
                            Roller
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => setResetting(user)}
                            aria-label="Şifre sıfırla"
                            title="Şifre sıfırla"
                          >
                            <KeyRound className="size-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => setActive.mutate({ id: user.id, active: !user.isActive })}
                            disabled={isSelf}
                            aria-label={user.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                            title={isSelf ? 'Kendinizi pasifleştiremezsiniz' : user.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                          >
                            <Power className="size-4" />
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => setToDelete(user)}
                            disabled={isSelf}
                            aria-label="Sil"
                            title={isSelf ? 'Kendinizi silemezsiniz' : 'Sil'}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {data && (
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              totalCount={data.totalCount}
              totalPages={data.totalPages}
              onPageChange={setPage}
              pageSizeOptions={buildPageSizeOptions(defaultPageSize, PAGE_SIZE_OPTIONS)}
              onPageSizeChange={changePageSize}
            />
          )}
        </div>
      ) : (
        <EmptyState
          icon={UsersIcon}
          title={search ? 'Sonuç bulunamadı' : 'Henüz kullanıcı yok'}
          description={
            search
              ? `"${search}" için eşleşen kullanıcı yok.`
              : 'İlk kullanıcıyı oluşturarak başlayın.'
          }
          action={
            !search && (
              <Button onClick={() => setCreateOpen(true)}>
                <UserPlus className="size-4" />
                Yeni Kullanıcı
              </Button>
            )
          }
        />
      )}

      {createOpen && <UserCreateModal onClose={() => setCreateOpen(false)} />}
      {editing && <EditUserRolesModal user={editing} onClose={() => setEditing(null)} />}
      {resetting && <ResetPasswordModal user={resetting} onClose={() => setResetting(null)} />}
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Kullanıcıyı sil"
        message={`"${toDelete?.displayName || toDelete?.email}" kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        danger
        loading={del.isPending}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}
