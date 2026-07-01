import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, CornerDownLeft } from 'lucide-react'
import { navGroups } from '@/config/navigation'
import { useAuth } from '@/features/auth/useAuth'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

/**
 * ⌘K / Ctrl+K komut paleti: yetkiye göre süzülmüş sayfalar arasında hızlı arama
 * ve klavye ile gezinme (↑/↓ seç, Enter git, Esc kapat).
 */
export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Yetkiye göre görünür tüm menü öğeleri (grupsuz düz liste).
  const items = useMemo(
    () =>
      navGroups
        .flatMap((group) => group.items)
        .filter((item) => !item.permission || hasPermission(item.permission)),
    [hasPermission],
  )

  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr-TR')
    if (!q) return items
    return items.filter((item) => item.label.toLocaleLowerCase('tr-TR').includes(q))
  }, [items, query])

  // Açılışta sıfırla + odakla.
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      // Modal DOM'a girdikten sonra odakla.
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // Sonuç listesi değişince aktif seçimi sınırların içinde tut.
  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, results.length - 1)))
  }, [results.length])

  if (!open) return null

  const go = (to: string) => {
    onClose()
    navigate(to)
  }

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (results.length ? (i + 1) % results.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (results.length ? (i - 1 + results.length) % results.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = results[activeIndex]
      if (item) go(item.to)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[15vh]">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Komut paleti"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 dark:border-slate-700">
          <Search className="size-5 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sayfa ara veya git..."
            className="w-full bg-transparent py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
        </div>

        <ul className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Sonuç bulunamadı.
            </li>
          ) : (
            results.map((item, index) => {
              const active = index === activeIndex
              return (
                <li key={item.to}>
                  <button
                    type="button"
                    onClick={() => go(item.to)}
                    onMouseMove={() => setActiveIndex(index)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                      active
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {active && <CornerDownLeft className="size-4 text-slate-400" />}
                  </button>
                </li>
              )
            })
          )}
        </ul>
      </div>
    </div>
  )
}
