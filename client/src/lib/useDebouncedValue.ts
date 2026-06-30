import { useEffect, useState } from 'react'

/**
 * Bir değeri belirtilen gecikmeyle (ms) geciktirir. Arama kutusu gibi hızlı
 * değişen girişlerde, her tuş vuruşunda istek atmamak için kullanılır.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(handle)
  }, [value, delayMs])

  return debounced
}
