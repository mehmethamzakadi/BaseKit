import { useState } from 'react'
import PageHeader from '@/components/dashboard/PageHeader'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import { useUsers } from '@/features/admin/queries'
import { getApiErrorMessage } from '@/types/api'
import type { UserDto } from '@/types/admin'
import EditUserRolesModal from './EditUserRolesModal'

export default function UsersPage() {
  const { data: users, isLoading, isError, error, refetch } = useUsers()
  const [editing, setEditing] = useState<UserDto | null>(null)

  return (
    <div>
      <PageHeader
        title="Kullanıcılar"
        description="Kullanıcıları ve rol atamalarını yönetin."
      />

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} />
      ) : users && users.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
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
      ) : (
        <p className="text-slate-500">Kullanıcı bulunamadı.</p>
      )}

      {editing && (
        <EditUserRolesModal user={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}
