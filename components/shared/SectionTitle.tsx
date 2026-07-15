import type { ReactNode } from 'react'

type SectionTitleProps = {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}

export function SectionTitle({ eyebrow, title, description, action }: SectionTitleProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-wide text-violet-600">{eyebrow}</p>
        ) : null}
        <h2 className="mt-1 text-xl font-black leading-7 text-slate-950">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
