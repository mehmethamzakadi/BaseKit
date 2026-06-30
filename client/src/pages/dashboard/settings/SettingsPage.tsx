import { useEffect, useMemo, useState } from 'react'
import PageHeader from '@/components/dashboard/PageHeader'
import Button from '@/components/ui/Button'
import ErrorState from '@/components/ui/ErrorState'
import Skeleton from '@/components/ui/Skeleton'
import { useSettings, useUpdateSettings } from '@/features/settings/queries'
import { useAuth } from '@/features/auth/useAuth'
import { getApiErrorMessage } from '@/types/api'
import type { SettingItem } from '@/types/settings'

export default function SettingsPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('system.settings.manage')

  const { data: groups, isLoading, isError, error, refetch } = useSettings()
  const updateSettings = useUpdateSettings()

  // Düzenlenen değerler — sunucudan gelen değerlerle başlatılır.
  const [values, setValues] = useState<Record<string, string>>({})

  // Tüm ayarları tek düz haritaya indirger (başlangıç + dirty karşılaştırması için).
  const serverValues = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const group of groups ?? []) {
      for (const item of group.items) map[item.key] = item.value
    }
    return map
  }, [groups])

  useEffect(() => {
    setValues(serverValues)
  }, [serverValues])

  const isDirty = useMemo(
    () => Object.keys(serverValues).some((k) => values[k] !== serverValues[k]),
    [values, serverValues],
  )

  const setValue = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const onSubmit = async () => {
    // Yalnızca değişen anahtarları gönder.
    const changed: Record<string, string> = {}
    for (const key of Object.keys(serverValues)) {
      if (values[key] !== serverValues[key]) changed[key] = values[key]
    }
    if (Object.keys(changed).length === 0) return
    await updateSettings.mutateAsync(changed).catch(() => {})
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Sistem Ayarları"
        description="Uygulama genelindeki yapılandırmayı buradan yönetin."
        actions={
          canManage ? (
            <Button
              type="button"
              onClick={onSubmit}
              loading={updateSettings.isPending}
              disabled={!isDirty}
            >
              Kaydet
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="space-y-6">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900"
            >
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <div className="space-y-6">
          {(groups ?? []).map((group) => (
            <section
              key={group.group}
              className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900"
            >
              <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                {group.group}
              </h2>
              <div className="space-y-5">
                {group.items.map((item) => (
                  <SettingField
                    key={item.key}
                    item={item}
                    value={values[item.key] ?? item.value}
                    disabled={!canManage}
                    onChange={(v) => setValue(item.key, v)}
                  />
                ))}
              </div>
            </section>
          ))}

          {canManage && (
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={onSubmit}
                loading={updateSettings.isPending}
                disabled={!isDirty}
              >
                Kaydet
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface SettingFieldProps {
  item: SettingItem
  value: string
  disabled: boolean
  onChange: (value: string) => void
}

function SettingField({ item, value, disabled, onChange }: SettingFieldProps) {
  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'

  if (item.type === 'boolean') {
    const checked = value === 'true'
    return (
      <label className="flex items-start gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange(checked ? 'false' : 'true')}
          className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${
            checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'
          }`}
        >
          <span
            className={`inline-block size-5 transform rounded-full bg-white transition ${
              checked ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
        <div>
          <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            {item.label}
          </span>
          {item.description && (
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              {item.description}
            </span>
          )}
        </div>
      </label>
    )
  }

  return (
    <div className="space-y-1">
      <label
        htmlFor={item.key}
        className="block text-sm font-medium text-slate-700 dark:text-slate-200"
      >
        {item.label}
      </label>
      {item.type === 'select' ? (
        <select
          id={item.key}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        >
          {(item.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={item.key}
          type={item.type === 'number' ? 'number' : 'text'}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      )}
      {item.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
      )}
    </div>
  )
}
