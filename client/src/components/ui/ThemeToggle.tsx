import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/features/theme/useTheme'
import type { Theme } from '@/features/theme/themeContext'

const order: Theme[] = ['system', 'light', 'dark']
const meta: Record<Theme, { icon: typeof Sun; label: string }> = {
  system: { icon: Monitor, label: 'Sistem' },
  light: { icon: Sun, label: 'Açık' },
  dark: { icon: Moon, label: 'Koyu' },
}

/** Temayı sistem → açık → koyu döngüsünde değiştiren buton. */
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const Icon = meta[theme].icon

  const cycle = () => {
    const next = order[(order.indexOf(theme) + 1) % order.length]
    setTheme(next)
  }

  return (
    <button
      type="button"
      onClick={cycle}
      title={`Tema: ${meta[theme].label}`}
      aria-label={`Tema: ${meta[theme].label}. Değiştirmek için tıklayın.`}
      className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      <Icon className="size-5" />
    </button>
  )
}
