import { useContext } from 'react'
import { ThemeContext } from './themeContext'

/** Tema bağlamına erişim. ThemeProvider dışında çağrılırsa hata fırlatır. */
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (ctx === null) {
    throw new Error('useTheme, <ThemeProvider> içinde kullanılmalıdır.')
  }
  return ctx
}
