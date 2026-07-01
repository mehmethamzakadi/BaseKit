import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { KeyRound, Power, Trash2, UserPlus, Users as UsersIcon, X } from 'lucide-react'
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
import {
  useUsers,
  useDeleteUser,
  useSetUserActive,
  useBulkDeleteUsers,
  useBulkSetUserActive,
} from '@/features/admin/queries'
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
  const bulkDelete = useBulkDeleteUsers()
  const bulkSetActive = useBulkSetUserActive()

  const [editing, setEditing] = useState<UserDto | null>(null)
  const [resetting, setResetting] = useState<UserDto | null>(null)
  const [toDelete, setToDelete] = useState<UserDto | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  // Çoklu seçim (yalnızca geçerli sayfa kapsamında).
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const users = data?.items ?? []
  const hasResults = users.length > 0

  // Sayfa/arama/sayfa boyutu değişince seçimi sıfırla.
  useEffect(() => {
    setSelected(new Set())
  }, [page, search, pageSize])

  // Kendi hesabı hariç seçilebilir kullanıcılar.
  const selectableIds = useMemo(
    () => users.filter((u) => u.id !== me?.userId).map((u) => u.id),
    [users, me?.userId],
  )
  const selectedIds = useMemo(() => [...selected], [selected])
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id))

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggleAll = () =>
    setSelected((prev) => (prev.size === selectableIds.length ? new Set() : new Set(selectableIds)))

  const clearSelection = () => setSelected(new Set())

  const confirmDelete = async () => {
    if (!toDelete) return
    try {
      await del.mutateAsync(toDelete.id)
      toast.success('Kullanıcı silindi.')
      setToDelete(null)
    } catch {
      /* hata toast'lanır */
    }
  }

  const confirmBulkDelete = async () => {
    try {
      await bulkDelete.mutateAsync(selectedIds)
      clearSelection()
      setBulkDeleteOpen(false)
    } catch {
      /* hata toast'lanır */
    }
  }

  const bulkSet = (active: boolean) => {
    bulkSetActive.mutate(
      { ids: selectedIds, active },
      { onSuccess: () => clearSelection() },
    )
  }

  // Tek satır aktif/pasif — başarıda "geri al" düğmeli bildirim gösterir.
  const toggleActive = (u: UserDto) => {
    const next = !u.isActive
    setActive.mutate(
      { id: u.id, active: next },
      {
        onSuccess: () =>
          toast(
            (t) => (
              <span className="flex items-center gap-3 text-sm">
                {next ? 'Kullanıcı aktifleştirildi.' : 'Kullanıcı pasifleştirildi.'}
                <button
                  type="button"
                  className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
                  onClick={() => {
                    toast.dismiss(t.id)
                    setActive.mutate({ id: u.id, active: !next })
                  }}
                >
                  Geri al
                </button>
              </span>
            ),
            { icon: next ? '✅' : '⏸️' },
          ),
      },
    )
  }

  const rowToggling = (id: string) => setActive.isPending && setActive.variables?.id === id
  const bulkBusy = bulkDelete.isPending || bulkSetActive.isPending

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

      {/* Toplu işlem çubuğu */}
      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 dark:border-brand-500/30 dark:bg-brand-500/10">
          <span className="text-sm font-medium text-brand-800 dark:text-brand-200">
            {selected.size} kullanıcı seçildi
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => bulkSet(true)} loading={bulkSetActive.isPending}>
              Aktifleştir
            </Button>
            <Button variant="secondary" onClick={() => bulkSet(false)} loading={bulkSetActive.isPending}>
              Pasifleştir
            </Button>
            <Button variant="danger" onClick={() => setBulkDeleteOpen(true)} disabled={bulkBusy}>
              <Trash2 className="size-4" />
              Sil
            </Button>
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-md p-1.5 text-brand-700 transition hover:bg-brand-100 dark:text-brand-300 dark:hover:bg-brand-500/20"
              aria-label="Seçimi temizle"
              title="Seçimi temizle"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

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
          {/* Masaüstü: tablo */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-200 dark:border-slate-600"
                      checked={allSelected}
                      onChange={toggleAll}
                      disabled={selectableIds.length === 0}
                      aria-label="Tümünü seç"
                    />
                  </th>
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
                        <input
                          type="checkbox"
                          className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-200 disabled:opacity-40 dark:border-slate-600"
                          checked={selected.has(user.id)}
                          onChange={() => toggleOne(user.id)}
                          disabled={isSelf}
                          aria-label={`${label} seç`}
                        />
                      </td>
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
                            onClick={() => toggleActive(user)}
                            disabled={isSelf}
                            loading={rowToggling(user.id)}
                            aria-label={user.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                            title={isSelf ? 'Kendinizi pasifleştiremezsiniz' : user.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                          >
                            {!rowToggling(user.id) && <Power className="size-4" />}
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

          {/* Mobil: kart listesi */}
          <ul className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
            {users.map((user) => {
              const isSelf = me?.userId === user.id
              const label = user.displayName || user.email || 'Kullanıcı'
              return (
                <li key={user.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-200 disabled:opacity-40 dark:border-slate-600"
                      checked={selected.has(user.id)}
                      onChange={() => toggleOne(user.id)}
                      disabled={isSelf}
                      aria-label={`${label} seç`}
                    />
                    <Avatar name={label} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-800 dark:text-slate-100">
                        {user.displayName || user.email}
                      </p>
                      {user.displayName && (
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        <Badge color={user.isActive ? 'green' : 'slate'}>
                          {user.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                        {user.roles.map((role) => (
                          <Badge key={role} color="brand">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <Button variant="secondary" onClick={() => setEditing(user)}>
                      Roller
                    </Button>
                    <Button variant="secondary" onClick={() => setResetting(user)} aria-label="Şifre sıfırla">
                      <KeyRound className="size-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => toggleActive(user)}
                      disabled={isSelf}
                      loading={rowToggling(user.id)}
                      aria-label={user.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                    >
                      {!rowToggling(user.id) && <Power className="size-4" />}
                    </Button>
                    <Button variant="danger" onClick={() => setToDelete(user)} disabled={isSelf} aria-label="Sil">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>

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
      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Seçili kullanıcıları sil"
        message={`Seçili ${selectedIds.length} kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Hepsini sil"
        danger
        loading={bulkDelete.isPending}
        onConfirm={confirmBulkDelete}
        onClose={() => setBulkDeleteOpen(false)}
      />
    </div>
  )
}
