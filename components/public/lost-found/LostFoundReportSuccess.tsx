import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import type { LostFoundReportSubmissionResult } from '@/components/public/lost-found/types'

export function LostFoundReportSuccess({
  result,
  onClose,
}: {
  result: LostFoundReportSubmissionResult
  onClose: () => void
}) {
  return (
    <Card className="overflow-hidden rounded-[1.75rem] border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-white text-2xl font-black text-emerald-700 shadow-sm">
        ✓
      </div>
      <h3 className="mt-4 text-3xl font-black tracking-tight text-slate-950">Report prepared</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-700">
        Thank you for helping the community. Your report details are ready for review and follow-up by email.
      </p>
      <p className="mt-3 text-xs font-semibold text-emerald-700">Reference: {result.report_id}</p>
      <Button type="button" onClick={onClose} className="mt-5" fullWidth>
        Done
      </Button>
    </Card>
  )
}
