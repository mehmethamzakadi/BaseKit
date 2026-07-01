import type { ReactNode } from 'react'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { usePublicSettings } from '@/features/settings/usePublicSettings'

interface PageHeaderProps {
  title: string
  description?: string
  /** Sağ tarafta gösterilecek aksiyonlar (örn. "Yeni Ekle" butonu). */
  actions?: ReactNode
}

/** Dashboard sayfaları için tutarlı başlık + aksiyon satırı. */
export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  const { siteName } = usePublicSettings()
  useDocumentTitle(title, siteName)

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
