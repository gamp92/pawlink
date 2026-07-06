import { Card } from '@/components/shared/Card'

type LoadingStateProps = {
  label?: string
}

export function LoadingState({ label = 'Loading Pawlink' }: LoadingStateProps) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-violet-100" />
        <div className="flex-1">
          <div className="h-2 w-40 rounded-full bg-slate-100" />
          <div className="mt-2 h-2 w-20 rounded-full bg-slate-100" />
        </div>
      </div>
      <p className="mt-3 text-xs font-semibold text-slate-500">{label}</p>
    </Card>
  )
}
