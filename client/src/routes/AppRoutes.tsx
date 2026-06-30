import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute } from '@/features/auth/guards'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import DashboardLayout from '@/pages/dashboard/DashboardLayout'
import DashboardHomePage from '@/pages/dashboard/DashboardHomePage'
import ProductsPage from '@/pages/dashboard/products/ProductsPage'
import ProfilePage from '@/pages/dashboard/profile/ProfilePage'
import UsersPage from '@/pages/dashboard/users/UsersPage'
import RolesPage from '@/pages/dashboard/roles/RolesPage'
import ForbiddenPage from '@/pages/ForbiddenPage'
import NotFoundPage from '@/pages/NotFoundPage'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public anasayfa */}
      <Route path="/" element={<HomePage />} />

      {/* Yalnızca anonim kullanıcılar */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Korumalı dashboard alanı (giriş zorunlu) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHomePage />} />

          {/* Kişisel — her giriş yapan kullanıcı */}
          <Route path="profile" element={<ProfilePage />} />

          {/* Modüller — yetki bazlı */}
          <Route element={<ProtectedRoute permission="catalog.view" />}>
            <Route path="products" element={<ProductsPage />} />
          </Route>

          {/* Yönetim — yetki bazlı */}
          <Route element={<ProtectedRoute permission="admin.users.manage" />}>
            <Route path="users" element={<UsersPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="admin.roles.manage" />}>
            <Route path="roles" element={<RolesPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
