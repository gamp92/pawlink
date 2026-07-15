import type { ReactNode } from 'react'
import { Card } from '@/components/shared/Card'

type SuccessStateProps = {
  title: string
  description?: string
  action?: ReactNode
}

export function SuccessState({ title, description, action }: SuccessStateProps) {
  return (
    <Card className="ds-state" role="status">
      <div className="ds-state-icon ds-state-icon-success">
        <span aria-hidden="true">OK</span>
      </div>
      <h2 className="mt-4 text-xl font-black text-slate-950">{title}</h2>
      {description ? <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  )
}
