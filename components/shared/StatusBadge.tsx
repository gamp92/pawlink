import type { AnimalStatus, ReportType } from '@/lib/mock-data'

type BadgeTone = 'purple' | 'teal' | 'red' | 'slate' | 'amber' | 'green'

type StatusBadgeProps = {
  label: string
  tone?: BadgeTone
}

const toneClasses: Record<BadgeTone, string> = {
  purple: 'border-violet-200 bg-violet-50 text-violet-700',
  teal: 'border-teal-200 bg-teal-50 text-teal-700',
  red: 'border-rose-200 bg-rose-50 text-rose-700',
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

export function StatusBadge({ label, tone = 'slate' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none ${toneClasses[tone]}`}
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
