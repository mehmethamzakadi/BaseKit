import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'
import Breadcrumbs from '@/components/dashboard/Breadcrumbs'
import CommandPalette from '@/components/dashboard/CommandPalette'
import { useNotificationsHub } from '@/features/notifications/useNotificationsHub'
import { useLocalStorageState } from '@/lib/useLocalStorageState'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useLocalStorageState('sidebar-collapsed', false)
  const [commandOpen, setCommandOpen] = useState(false)

  // Oturum açık alanda gerçek zamanlı bildirim bağlantısını kur.
  useNotificationsHub()

  // ⌘K / Ctrl+K ile komut paletini aç.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Klavye kullanıcıları için içeriğe atlama bağlantısı */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        İçeriğe geç
      </a>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={collapsed} />
      <div className={collapsed ? 'md:pl-16' : 'md:pl-64'}>
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          collapsed={collapsed}
          onOpenCommand={() => setCommandOpen(true)}
        />
        <main id="main-content" tabIndex={-1} className="p-4 outline-none md:p-6">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>

      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  )
}
