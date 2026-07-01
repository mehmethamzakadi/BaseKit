import { useEffect, useState } from 'react'
import type { Coords } from '@/types/insights'

type GeoState = {
  coords: Coords | null
  /** Konum çözümleniyor mu (izin bekleniyor). */
  loading: boolean
  /** İzin reddedildi veya alınamadı → backend varsayılan konuma düşer. */
  denied: boolean
}

/**
 * Tarayıcı Geolocation API'sinden konum alır. İzin verilmez/başarısız olursa
 * `coords` null kalır ve çağıran sorgular backend varsayılan konumunu (İstanbul)
 * kullanır. Tek seferlik çözümleme yapar.
 */
export function useGeolocation(): GeoState {
  const [state, setState] = useState<GeoState>({
    coords: null,
    loading: true,
    denied: false,
  })

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setState({ coords: null, loading: false, denied: true })
      return
    }

    let active = true
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!active) return
        setState({
          coords: {
            lat: Number(pos.coords.latitude.toFixed(4)),
            lon: Number(pos.coords.longitude.toFixed(4)),
          },
          loading: false,
          denied: false,
        })
      },
      () => {
        if (!active) return
        setState({ coords: null, loading: false, denied: true })
      },
      { timeout: 8000, maximumAge: 10 * 60_000 },
    )

    return () => {
      active = false
    }
  }, [])

  return state
}
