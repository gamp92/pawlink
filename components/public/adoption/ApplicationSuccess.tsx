import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import type { AdoptionApplicationResult, SelectedAdoptionMatch } from '@/components/public/adoption/types'

export function ApplicationSuccess({
  match,
  result,
  onClose,
}: {
  match: SelectedAdoptionMatch
  result: AdoptionApplicationResult
  onClose: () => void
}) {
  return (
    <Card className="border-emerald-200 bg-emerald-50">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-2xl font-black text-emerald-700">
        ✓
      </div>
      <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-950">Application sent for review</h3>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        Your application for {match.animal.name} was sent for review. The shelter will contact you by email.
      </p>
      <p className="mt-3 text-xs font-semibold text-emerald-700">
        Reference: {result.application_id}
      </p>
      <Button onClick={onClose} className="mt-5" fullWidth>
        Done
      </Button>
    </Card>
  )
}
