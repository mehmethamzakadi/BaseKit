import { useEffect } from 'react'

/**
 * Sayfa başlığını (`document.title`) günceller. `title` verilirse
 * "Başlık · SiteAdı", aksi halde yalnızca site adı gösterilir.
 * Bileşen ekrandan kalkınca değeri değiştirmez (bir sonraki sayfa kendi başlığını kurar).
 */
export function useDocumentTitle(title: string | undefined, siteName: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${siteName}` : siteName
  }, [title, siteName])
}
