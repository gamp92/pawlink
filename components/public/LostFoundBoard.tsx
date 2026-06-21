import { reportTypeTone, StatusBadge } from '@/components/shared/StatusBadge'
import { lostFoundReports } from '@/lib/mock-data'

export function LostFoundBoard() {
  const matchedReport = lostFoundReports.find((report) => report.match_confidence)

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_170px]">
      <div className="relative min-h-[255px] overflow-hidden rounded-lg border border-teal-100 bg-teal-50">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,118,110,.12)_1px,transparent_1px),linear-gradient(rgba(15,118,110,.12)_1px,transparent_1px)] bg-[size:86px_86px]" />
        <div className="absolute left-[22%] top-[22%] h-24 w-36 rounded bg-teal-100/60" />
        <div className="absolute left-[18%] top-[28%] h-36 w-36 rounded-full border border-dashed border-rose-500" />

        {lostFoundReports.map((report, index) => (
          <div
            key={report.id}
            className="absolute rounded bg-white px-2 py-1 text-[11px] font-bold shadow-sm"
            style={{
              left: `${30 + index * 12}%`,
              top: `${34 + index * 10}%`,
            }}
          >
            <span className={report.report_type === 'lost' ? 'text-rose-600' : 'text-teal-600'}>
              {report.report_type}
            </span>{' '}
            - {report.species}
          </div>
        ))}

        <div className="absolute bottom-3 left-3 rounded bg-white p-2 text-[11px] shadow-sm">
          <div className="text-rose-600">Lost pet</div>
          <div className="text-teal-600">Found pet</div>
        </div>

        {matchedReport ? (
          <div className="absolute bottom-3 right-3 w-40 rounded-lg border border-violet-200 bg-white p-3 shadow-sm">
            <p className="text-xs font-bold">Vision match found</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="grid h-12 place-items-center rounded bg-rose-50 text-xs">Lost</div>
              <div className="grid h-12 place-items-center rounded bg-teal-50 text-xs">Found</div>
            </div>
            <p className="mt-2 text-right text-xs font-bold text-violet-700">
              {matchedReport.match_confidence}% confidence
            </p>
            <button className="mt-2 w-full rounded bg-violet-600 py-1.5 text-xs font-bold text-white">
              Notify owner
            </button>
          </div>
        ) : null}
      </div>

      <aside>
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-3">
          <p className="text-xs font-bold text-slate-800">14 neighbors alerted</p>
          <p className="mt-1 text-[11px] leading-4 text-slate-500">
            Users within 2km of Colonia Roma received an email alert for Max.
          </p>
        </div>

        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
          <h3 className="text-sm font-bold">Active reports</h3>
          <div className="mt-3 space-y-3">
            {lostFoundReports.map((report) => (
              <div key={report.id} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold">{report.pet_name}</p>
                  <StatusBadge label={report.report_type} tone={reportTypeTone(report.report_type)} />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {report.color} - {report.location_notes}
                </p>
              </div>
            ))}
          </div>
          <button className="mt-3 w-full rounded bg-violet-600 py-2 text-xs font-bold text-white">
            + Report a pet
          </button>
        </div>
      </aside>
    </div>
  )
}
