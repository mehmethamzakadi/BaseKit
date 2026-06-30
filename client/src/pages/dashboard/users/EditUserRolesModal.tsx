import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import { useRoles, useAssignUserRoles } from '@/features/admin/queries'
import { getApiErrorMessage } from '@/types/api'
import type { UserDto } from '@/types/admin'

interface Props {
  user: UserDto
  onClose: () => void
}

export default function EditUserRolesModal({ user, onClose }: Props) {
  // Rol atama seçicisi tüm rolleri ister; sayfalamayı bypass etmek için yüksek pageSize.
  const { data: rolesPage, isLoading, isError, error } = useRoles({ pageSize: 100 })
  const roles = rolesPage?.items
  const assign = useAssignUserRoles()
  const [selected, setSelected] = useState<string[]>(user.roles)

  const toggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((r) => r !== name) : [...prev, name],
    )
  }

  const save = async () => {
    try {
      await assign.mutateAsync({ id: user.id, roles: selected })
      onClose()
    } catch {
      // hata mutasyon içinde toast'lanır; modal açık kalır
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Roller — ${user.email}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            İptal
          </Button>
          <Button onClick={save} loading={assign.isPending} disabled={isLoading || isError}>
            Kaydet
          </Button>
        </>
      }
    >
      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <ErrorState message={getApiErrorMessage(error)} />
      ) : (
        <div className="space-y-2">
          {roles?.map((role) => (
            <label
              key={role.id}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 px-3 py-2 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <input
                type="checkbox"
                checked={selected.includes(role.name)}
                onChange={() => toggle(role.name)}
                className="mt-0.5 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-200"
              />
              <div>
                <p className="text-sm font-medium text-slate-800">{role.name}</p>
                {role.description && (
                  <p className="text-xs text-slate-500">{role.description}</p>
                )}
              </div>
            </label>
          ))}
        </div>
      )}
    </Modal>
  )
}
