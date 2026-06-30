import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { settingsApi } from './settingsApi'
import { PublicSettingsContext, PUBLIC_SETTINGS_DEFAULTS } from './publicSettingsContext'
import { useTheme } from '@/features/theme/useTheme'
import FullPageSpinner from '@/components/FullPageSpinner'

const THEME_STORAGE_KEY = 'basekit.theme'

/**
 * Herkese açık ayarları (site adı, kayıt durumu, bakım modu, varsayılan tema/
 * sayfa boyutu) uygulama açılışında yükler ve uygular. İlk yüklemede kısa bir
 * spinner gösterir; böylece marka adı, tema ve sayfa boyutu ilk boyamadan
 * itibaren doğru olur. Ayar ucu hata verirse güvenli varsayılanlarla devam eder.
 */
export function PublicSettingsProvider({ children }: { children: ReactNode }) {
  const { setTheme } = useTheme()
  // Provider mount olduğunda kullanıcının açık bir tema tercihi var mıydı?
  const hadStoredTheme = useRef(localStorage.getItem(THEME_STORAGE_KEY) !== null)

  const { data, isLoading } = useQuery({
    queryKey: ['system', 'settings', 'public'],
    queryFn: settingsApi.getPublic,
    staleTime: 60_000,
    retry: 1,
  })

  const settings = data ?? PUBLIC_SETTINGS_DEFAULTS

  // Sekme başlığı = site adı.
  useEffect(() => {
    document.title = settings.siteName
  }, [settings.siteName])

  // Tema tercihi yapmamış kullanıcıya sunucu varsayılanını uygula (yalnızca bir kez).
  useEffect(() => {
    if (!data || hadStoredTheme.current) return
    setTheme(data.defaultTheme)
    hadStoredTheme.current = true
  }, [data, setTheme])

  if (isLoading) return <FullPageSpinner />

  return <PublicSettingsContext value={settings}>{children}</PublicSettingsContext>
}
