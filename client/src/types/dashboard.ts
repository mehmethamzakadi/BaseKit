/** /admin/stats öğesi: tek bir özet istatistik. */
export interface StatItemDto {
  key: string
  label: string
  value: number
  /** İkon anahtarı (lucide ikonuna eşlenir). */
  icon: string
}
