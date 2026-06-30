import { createContext } from 'react'
import type { PublicSettings } from '@/types/settings'

/** Ayarlar yüklenene (veya hata olduğunda) kadar geçerli güvenli varsayılanlar. */
export const PUBLIC_SETTINGS_DEFAULTS: PublicSettings = {
  siteName: 'BaseKit',
  registrationEnabled: true,
  maintenanceMode: false,
  defaultPageSize: 20,
  defaultTheme: 'system',
}

export const PublicSettingsContext = createContext<PublicSettings>(PUBLIC_SETTINGS_DEFAULTS)
