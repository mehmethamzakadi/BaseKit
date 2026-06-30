import { apiClient } from '@/lib/apiClient'
import type { PublicSettings, SettingGroup } from '@/types/settings'

/** Sistem ayarları uç noktalarının tiplenmiş sarmalayıcıları. */
export const settingsApi = {
  getSettings: () =>
    apiClient.get<SettingGroup[]>('/system/settings').then((r) => r.data),

  updateSettings: (values: Record<string, string>) =>
    apiClient.put<void>('/system/settings', { values }).then((r) => r.data),

  getPublic: () =>
    apiClient.get<PublicSettings>('/system/settings/public').then((r) => r.data),
}
