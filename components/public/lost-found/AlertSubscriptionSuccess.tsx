import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import type { AlertSubscriptionResult } from '@/components/public/lost-found/types'

export function AlertSubscriptionSuccess({
  result,
  onClose,
}: {
  result: AlertSubscriptionResult
  onClose: () => void
}) {
  return (
    <Card className="overflow-hidden rounded-[1.75rem] border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-white text-2xl font-black text-emerald-700 shadow-sm">
        ✓
      </div>
      <h3 className="mt-4 text-3xl font-black tracking-tight text-slate-950">Alert preference ready</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-700">
        Your nearby alert preference is ready. You can return to Lost & Found anytime to adjust your alert area.
      </p>
      <p className="mt-3 text-xs font-semibold text-emerald-700">Reference: {result.subscription_id}</p>
      <Button type="button" onClick={onClose} className="mt-5" fullWidth>
        Done
      </Button>
    </Card>
  )
}
