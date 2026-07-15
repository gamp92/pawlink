import type { ReactNode } from 'react'

type PageHeaderProps = {
  eyebrow?: string
  title: string
  subtitle?: string
  action?: ReactNode
}

export function PageHeader({ eyebrow, title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-wide text-violet-600">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-3xl font-black leading-none text-slate-950 sm:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
