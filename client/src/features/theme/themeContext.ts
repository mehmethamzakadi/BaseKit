import { createContext } from 'react'

export type Theme = 'light' | 'dark' | 'system'

export interface ThemeContextValue {
  /** Kullanıcı tercihi. */
  theme: Theme
  setTheme: (theme: Theme) => void
  /** Sistem tercihi çözülmüş hali (gerçekte uygulanan). */
  resolved: 'light' | 'dark'
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
