import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { PublicSettingsProvider } from '@/features/settings/PublicSettingsProvider'
import MaintenanceBanner from '@/components/MaintenanceBanner'
import AppRoutes from '@/routes/AppRoutes'

export default function App() {
  return (
    <BrowserRouter>
      <PublicSettingsProvider>
        <AuthProvider>
          <MaintenanceBanner />
          <AppRoutes />
        </AuthProvider>
      </PublicSettingsProvider>
    </BrowserRouter>
  )
}
