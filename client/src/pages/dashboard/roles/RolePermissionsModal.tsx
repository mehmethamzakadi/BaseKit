import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import { usePermissions, useSetRolePermissions } from '@/features/admin/queries'
import { getApiErrorMessage } from '@/types/api'
import type { PermissionItemDto, RoleDto } from '@/types/admin'

interface Props {
  role: RoleDto
  onClose: () => void
}

export default function RolePermissionsModal({ role, onClose }: Props) {
  const { data: groups, isLoading, isError, error } = usePermissions()
  const setPerms = useSetRolePermissions()
  const [selected, setSelected] = useState<Set<string>>(new Set(role.permissions))

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const toggleGroup = (items: PermissionItemDto[], allChecked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const item of items) {
        if (allChecked) next.delete(item.name)
        else next.add(item.name)
      }
      return next
    })
  }

  const save = async () => {
    try {
      await setPerms.mutateAsync({ id: role.id, permissions: [...selected] })
      onClose()
    } catch {
      // hata mutasyonda toast'lanır
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Yetkiler — ${role.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            İptal
          </Button>
          <Button onClick={save} loading={setPerms.isPending} disabled={isLoading || isError}>
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
        <div className="space-y-5">
          {groups?.map((group) => {
            const allChecked = group.items.every((item) => selected.has(item.name))
            return (
              <div key={group.group}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{group.group}</p>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.items, allChecked)}
                    className="text-xs font-medium text-brand-600 hover:underline"
                  >
                    {allChecked ? 'Tümünü kaldır' : 'Tümünü seç'}
                  </button>
                </div>
                <div className="grid gap-1 sm:grid-cols-2">
                  {group.items.map((item) => (
                    <label
                      key={item.name}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(item.name)}
                        onChange={() => toggle(item.name)}
                        className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-200"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-200">{item.displayName}</span>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
