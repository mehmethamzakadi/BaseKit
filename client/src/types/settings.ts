/** Backend `SettingType` karşılığı — istemcide giriş alanı seçimini belirler. */
export type SettingType = 'text' | 'number' | 'boolean' | 'select'

export interface SettingOption {
  value: string
  label: string
}

/** Tek bir ayarın metadata'sı + etkin değeri. */
export interface SettingItem {
  key: string
  label: string
  description?: string | null
  type: SettingType
  value: string
  options?: SettingOption[] | null
}

/** Ayarların gruplanmış hâli (örn. "Genel", "Güvenlik"). */
export interface SettingGroup {
  group: string
  items: SettingItem[]
}

/** Kimlik doğrulaması olmadan okunabilen, istemcide uygulanan güvenli ayarlar. */
export interface PublicSettings {
  siteName: string
  registrationEnabled: boolean
  maintenanceMode: boolean
  defaultPageSize: number
  defaultTheme: 'light' | 'dark' | 'system'
}
