import type { AnimalStatus, ReportType } from '@/lib/mock-data'

type BadgeTone = 'purple' | 'teal' | 'red' | 'slate' | 'amber' | 'green'

type StatusBadgeProps = {
  label: string
  tone?: BadgeTone
}

const toneClasses: Record<BadgeTone, string> = {
  purple: 'ds-badge-purple',
  teal: 'ds-badge-teal',
  red: 'ds-badge-red',
  slate: 'ds-badge-slate',
  amber: 'ds-badge-amber',
  green: 'ds-badge-green',
}

export function StatusBadge({ label, tone = 'slate' }: StatusBadgeProps) {
  return (
    <span
      className={`ds-badge ${toneClasses[tone]}`}
    >
      {label}
    </span>
  )
}

export function animalStatusTone(status: AnimalStatus): BadgeTone {
  if (status === 'available') return 'green'
  if (status === 'in_process') return 'amber'
  return 'slate'
}

export function reportTypeTone(type: ReportType): BadgeTone {
  return type === 'lost' ? 'red' : 'teal'
}
