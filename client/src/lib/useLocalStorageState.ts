import { useEffect, useState } from 'react'

/**
 * `useState` gibi çalışır ama değeri `localStorage`'da kalıcılaştırır.
 * Yalnızca serileştirilebilir (JSON) değerler için uygundur.
 */
export function useLocalStorageState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw !== null ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* kota dolu / gizli mod — sessizce yok say */
    }
  }, [key, value])

  return [value, setValue] as const
}
