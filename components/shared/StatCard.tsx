import type { ReactNode } from 'react'

type StatTone = 'violet' | 'teal' | 'rose' | 'slate'

type StatCardProps = {
  label: string
  value: string | number
  detail?: string
  icon?: ReactNode
  tone?: StatTone
}

const toneClasses: Record<StatTone, string> = {
  violet: 'from-violet-50 to-white text-violet-700',
  teal: 'from-teal-50 to-white text-teal-700',
  rose: 'from-rose-50 to-white text-rose-700',
  slate: 'from-slate-50 to-white text-slate-700',
}

export function StatCard({ label, value, detail, icon, tone = 'violet' }: StatCardProps) {
  return (
    <article className={`ds-card ds-card-pad-md bg-gradient-to-br ${toneClasses[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black leading-none text-slate-950">{value}</p>
        </div>
        {icon ? (
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/60 bg-white/90 text-sm font-black shadow-sm">
            {icon}
          </div>
        ) : null}
      </div>
      {detail ? <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{detail}</p> : null}
    </article>
  )
}
