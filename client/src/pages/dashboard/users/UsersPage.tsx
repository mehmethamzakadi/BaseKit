import { useEffect, useState } from 'react'
import PageHeader from '@/components/dashboard/PageHeader'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import SearchInput from '@/components/ui/SearchInput'
import Pagination from '@/components/ui/Pagination'
import { useUsers } from '@/features/admin/queries'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { getApiErrorMessage } from '@/types/api'
import type { UserDto } from '@/types/admin'
import EditUserRolesModal from './EditUserRolesModal'

const PAGE_SIZE_OPTIONS = [10, 25, 50]

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
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
  const [editing, setEditing] = useState<UserDto | null>(null)

  const users = data?.items ?? []
  const hasResults = users.length > 0

  return (
    <div>
      <PageHeader
        title="Kullanıcılar"
        description="Kullanıcıları ve rol atamalarını yönetin."
      />

      <div className="mb-4 max-w-sm">
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder="E-posta ile ara..."
        />
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} />
      ) : hasResults ? (
        <div
          className={`overflow-hidden rounded-xl border border-slate-200 bg-white transition-opacity ${
            isPlaceholderData ? 'opacity-60' : ''
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">E-posta</th>
                  <th className="px-4 py-3 font-semibold">Roller</th>
                  <th className="px-4 py-3 text-right font-semibold">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{user.email}</td>
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
                    <td className="px-4 py-3 text-right">
                      <Button variant="secondary" onClick={() => setEditing(user)}>
                        Rolleri düzenle
                      </Button>
                    </td>
                  </tr>
                ))}
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
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageSizeChange={changePageSize}
            />
          )}
        </div>
      ) : (
        <p className="text-slate-500">
          {search ? `"${search}" için sonuç bulunamadı.` : 'Kullanıcı bulunamadı.'}
        </p>
      )}

      {editing && (
        <EditUserRolesModal user={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}
