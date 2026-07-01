import { useEffect } from 'react'

/**
 * `when` true olduğu sürece sekme kapatma / sayfa yenileme öncesi tarayıcının
 * yerleşik "Değişiklikleriniz kaybolabilir" uyarısını tetikler.
 *
 * Not: Uygulama içi rota geçişlerini engellemek React Router'ın veri-router
 * (createBrowserRouter) API'sini gerektirir; proje `<BrowserRouter>` kullandığı
 * için burada yalnızca sekme kapatma/yenileme kapsanır.
 */
export function useUnsavedChangesPrompt(when: boolean) {
  useEffect(() => {
    if (!when) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [when])
}
