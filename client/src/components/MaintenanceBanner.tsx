import { Wrench } from 'lucide-react'
import { usePublicSettings } from '@/features/settings/usePublicSettings'

/** Bakım modu açıkken tüm sayfaların üstünde gösterilen uyarı şeridi. */
export default function MaintenanceBanner() {
  const { maintenanceMode } = usePublicSettings()
  if (!maintenanceMode) return null

  return (
    <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950">
      <Wrench className="size-4 shrink-0" />
      Sistem şu anda bakım modunda. Bazı işlevler geçici olarak etkilenebilir.
    </div>
  )
}
