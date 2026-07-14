import { Card } from '@/components/shared/Card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { SelectedAdoptionMatch } from '@/components/public/adoption/types'

export function SelectedPetSummary({ match, compact = false }: { match: SelectedAdoptionMatch; compact?: boolean }) {
  return (
    <Card className={compact ? 'p-3' : 'border-violet-200'}>
      <div className="flex items-center gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-50 to-teal-50 text-xl font-black text-violet-700">
          {match.animal.name.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-lg font-black tracking-tight text-slate-950">{match.animal.name}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{match.animal.shelter.name}</p>
            </div>
            <StatusBadge label={`${match.score}% match`} tone="purple" />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {match.animal.breed} - {match.animal.age_years} years - {match.animal.size}
          </p>
        </div>
      </div>

      {!compact ? (
        <div className="mt-3 space-y-2">
          {match.reasons.map((reason) => (
            <div key={reason} className="rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-900">
              {reason}
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  )
}
