import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'
import { useNotificationsHub } from '@/features/notifications/useNotificationsHub'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Oturum açık alanda gerçek zamanlı bildirim bağlantısını kur.
  useNotificationsHub()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:pl-64">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
