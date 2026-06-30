import {
  LayoutDashboard,
  Package,
  Users,
  ShieldCheck,
  ScrollText,
  Settings,
  Bell,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  /** Bu yetki yoksa öğe menüde gösterilmez. Boşsa herkese açık. */
  permission?: string
  /** react-router NavLink `end` (tam eşleşme) — index rotaları için. */
  end?: boolean
}

export interface NavGroup {
  label?: string
  items: NavItem[]
}

/**
 * Dashboard menüsü. Görünürlük kullanıcının yetkilerine göre Sidebar'da
 * filtrelenir; bir grubun hiç öğesi kalmazsa grup gizlenir.
 */
export const navGroups: NavGroup[] = [
  {
    items: [
      { label: 'Kontrol Paneli', to: '/dashboard', icon: LayoutDashboard, end: true },
      { label: 'Bildirimler', to: '/dashboard/notifications', icon: Bell },
    ],
  },
  {
    label: 'Modüller',
    items: [
      { label: 'Katalog', to: '/dashboard/products', icon: Package, permission: 'catalog.view' },
    ],
  },
  {
    label: 'Yönetim',
    items: [
      { label: 'Kullanıcılar', to: '/dashboard/users', icon: Users, permission: 'admin.users.manage' },
      { label: 'Roller & Yetkiler', to: '/dashboard/roles', icon: ShieldCheck, permission: 'admin.roles.manage' },
      { label: 'Denetim Kayıtları', to: '/dashboard/audit', icon: ScrollText, permission: 'admin.audit.view' },
      { label: 'Sistem Ayarları', to: '/dashboard/settings', icon: Settings, permission: 'system.settings.view' },
    ],
  },
]
