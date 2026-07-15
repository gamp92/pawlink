import { Card } from '@/components/shared/Card'

type LoadingStateProps = {
  label?: string
}

export function LoadingState({ label = 'Loading Pawlink' }: LoadingStateProps) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 animate-pulse rounded-2xl bg-gradient-to-br from-violet-100 to-teal-100" />
        <div className="flex-1">
          <div className="h-2.5 w-44 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-2 h-2.5 w-24 animate-pulse rounded-full bg-slate-100" />
        </div>
      </div>
      <p className="mt-3 text-xs font-semibold text-slate-500" aria-live="polite">{label}</p>
    </Card>
  )
}
