import type { ReactNode } from 'react'
import { Card } from '@/components/shared/Card'

type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-violet-50 text-sm font-black text-violet-700">
        PL
      </div>
      <h2 className="mt-3 text-lg font-black tracking-tight text-slate-950">{title}</h2>
      {description ? <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  )
}
