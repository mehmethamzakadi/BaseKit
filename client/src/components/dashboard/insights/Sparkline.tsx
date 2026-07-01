interface SparklineProps {
  data: number[]
  /** Yükseliş (yeşil) / düşüş (kırmızı) rengini belirler. */
  positive?: boolean
  className?: string
}

/**
 * Basit, bağımsız SVG sparkline (harici grafik kütüphanesi yok). Verilen
 * sayı dizisini normalize edip küçük bir çizgi grafiği çizer.
 */
export default function Sparkline({ data, positive = true, className = '' }: SparklineProps) {
  if (data.length < 2) return null

  const width = 100
  const height = 32
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / range) * height
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  const stroke = positive ? 'stroke-emerald-500' : 'stroke-red-500'

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={`h-8 w-full ${className}`}
      aria-hidden
    >
      <polyline
        points={points}
        fill="none"
        className={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
