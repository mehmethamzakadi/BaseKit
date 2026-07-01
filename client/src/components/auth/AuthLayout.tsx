import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { usePublicSettings } from '@/features/settings/usePublicSettings'
import { useDocumentTitle } from '@/lib/useDocumentTitle'

interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

/** Kimlik doğrulama sayfaları için ortak kart düzeni. */
export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const { siteName } = usePublicSettings()
  useDocumentTitle(title, siteName)
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to="/" className="text-2xl font-bold text-brand-700 dark:text-brand-400">
            {siteName}
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">{footer}</div>}
      </div>
    </div>
  )
}
