import type { ReactNode } from 'react'

type BadgeColor = 'slate' | 'brand' | 'green' | 'red' | 'amber'

const colors: Record<BadgeColor, string> = {
  slate: 'bg-slate-100 text-slate-700',
  brand: 'bg-brand-50 text-brand-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
}

export default function Badge({
  children,
  color = 'slate',
}: {
  children: ReactNode
  color?: BadgeColor
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[color]}`}
    >
      {children}
    </span>
  )
}
