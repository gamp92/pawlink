import type { ReactNode } from 'react'
import { Card } from '@/components/shared/Card'

type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="overflow-hidden text-center">
      <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-violet-100 to-teal-100 text-xl font-black text-violet-700 shadow-sm">
        <div className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-white/80" />
        <span aria-hidden="true">✦</span>
      </div>
      <h2 className="mt-4 text-xl font-black tracking-tight text-slate-950">{title}</h2>
      {description ? <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  )
}
