import type { ReactNode } from 'react'
import { Card } from '@/components/shared/Card'

type ErrorStateProps = {
  title?: string
  description: string
  action?: ReactNode
}

export function ErrorState({ title = 'Something needs attention', description, action }: ErrorStateProps) {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <p className="text-sm font-black text-amber-700">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  )
}
