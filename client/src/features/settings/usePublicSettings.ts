import { useContext } from 'react'
import { PublicSettingsContext } from './publicSettingsContext'

/** Uygulamaya yansıtılan herkese açık ayarlara erişim (site adı, kayıt durumu, vb.). */
export function usePublicSettings() {
  return useContext(PublicSettingsContext)
}
