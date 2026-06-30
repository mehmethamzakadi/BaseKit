import { useEffect, useState } from 'react'
import { ScrollText } from 'lucide-react'
import PageHeader from '@/components/dashboard/PageHeader'
import Badge from '@/components/ui/Badge'
import TableSkeleton from '@/components/ui/TableSkeleton'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import SearchInput from '@/components/ui/SearchInput'
import Pagination from '@/components/ui/Pagination'
import { useAuditLogs } from '@/features/admin/queries'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { getApiErrorMessage } from '@/types/api'

const PAGE_SIZE_OPTIONS = [20, 50, 100]

const actionLabels: Record<string, string> = {
  'user.create': 'Kullanıcı oluşturuldu',
  'user.delete': 'Kullanıcı silindi',
  'user.activate': 'Kullanıcı aktifleştirildi',
  'user.deactivate': 'Kullanıcı pasifleştirildi',
  'user.reset_password': 'Şifre sıfırlandı',
  'user.assign_roles': 'Roller atandı',
  'role.set_permissions': 'Rol yetkileri değiştirildi',
  'role.delete': 'Rol silindi',
}

const dateFmt = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'medium' })

export default function AuditLogsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput.trim(), 300)

  useEffect(() => {
    setPage(1)
  }, [search])

  const changePageSize = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  const { data, isLoading, isError, error, refetch, isPlaceholderData } = useAuditLogs({
    page,
    pageSize,
    search: search || undefined,
  })

  const logs = data?.items ?? []
  const hasResults = logs.length > 0

  return (
    <div>
      <PageHeader title="Denetim Kayıtları" description="Sistemdeki kritik aksiyonların izi." />

      <div className="mb-4 max-w-sm">
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Eylem, kullanıcı veya hedef ara..."
        />
      </div>

      {isLoading ? (
        <TableSkeleton columns={5} />
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
                  <th className="px-4 py-3 font-semibold">Zaman</th>
                  <th className="px-4 py-3 font-semibold">Kullanıcı</th>
                  <th className="px-4 py-3 font-semibold">Eylem</th>
                  <th className="px-4 py-3 font-semibold">Hedef</th>
                  <th className="px-4 py-3 font-semibold">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                      {dateFmt.format(new Date(log.createdAtUtc))}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {log.userEmail ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge color="brand">{actionLabels[log.action] ?? log.action}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{log.details ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {log.ipAddress ?? '—'}
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
        <EmptyState
          icon={ScrollText}
          title={search ? 'Sonuç bulunamadı' : 'Henüz kayıt yok'}
          description={
            search
              ? `"${search}" için eşleşen denetim kaydı yok.`
              : 'Kritik aksiyonlar gerçekleştikçe burada listelenecek.'
          }
        />
      )}
    </div>
  )
}
