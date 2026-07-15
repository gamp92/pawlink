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
      <h3 className="mt-4 text-3xl font-black tracking-tight text-slate-950">Report submitted</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-700">
        Thank you for helping the community. Your report is now visible on the Lost & Found map so neighbors can help.
      </p>
      <div className="mt-4 rounded-2xl border border-emerald-100 bg-white/80 p-3 text-left">
        <p className="text-xs font-bold text-slate-400">Report reference</p>
        <p className="mt-1 break-all text-sm font-black text-emerald-700">{result.report_id}</p>
        <p className="mt-2 text-xs font-semibold text-slate-500">
          Status: {result.status}
        </p>
      </div>
      <Button type="button" onClick={onClose} className="mt-5" fullWidth>
        Return to Lost & Found
      </Button>
    </Card>
  )
}
