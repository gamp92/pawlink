'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { reportTypeTone, StatusBadge } from '@/components/shared/StatusBadge'
import { AlertSubscriptionFlow } from '@/components/public/lost-found/AlertSubscriptionFlow'
import { ReportPetFlow } from '@/components/public/lost-found/ReportPetFlow'
import {
  lostFoundReports,
  type LostFoundReport,
  type ReportType,
  type Species,
} from '@/lib/mock-data'

type ReportFilter = 'all' | ReportType

type ApiLostFoundReport = {
  id: string
  report_type: ReportType
  pet_name: string | null
  species: Species | null
  breed: string | null
  color: string | null
  description: string | null
  photo_urls: string[] | null
  location: LostFoundReport['location'] | null
  location_notes: string | null
  city: string | null
  status: LostFoundReport['status']
  matched_report_id: string | null
  match_confidence: number | null
  created_at: string
}

const markerPositions = [
  { left: '31%', top: '33%' },
  { left: '48%', top: '35%' },
  { left: '39%', top: '54%' },
  { left: '58%', top: '50%' },
  { left: '26%', top: '62%' },
]

const speciesIcon: Record<Species, string> = {
  dog: 'Dog',
  cat: 'Cat',
  other: 'Pet',
}

function toLostFoundReport(apiReport: ApiLostFoundReport): LostFoundReport {
  return {
    id: apiReport.id,
    report_type: apiReport.report_type,
    pet_name: apiReport.pet_name ?? (apiReport.report_type === 'found' ? 'Unknown pet' : 'Unnamed pet'),
    species: apiReport.species ?? 'other',
    breed: apiReport.breed ?? 'Mixed',
    color: apiReport.color ?? 'unknown',
    description: apiReport.description ?? 'No description provided yet.',
    photo_urls: apiReport.photo_urls ?? [],
    location: apiReport.location ?? { lat: 19.4133, lng: -99.1718 },
    location_notes: apiReport.location_notes ?? 'Location shared by the community',
    city: apiReport.city ?? 'CDMX',
    status: apiReport.status,
    matched_report_id: apiReport.matched_report_id,
    match_confidence: apiReport.match_confidence,
    created_at: apiReport.created_at,
  }
}

function formatDate(value: string) {
  return value.slice(0, 10)
}

function timeAgoFor(index: number) {
  return index === 0 ? 'Today' : index === 1 ? 'Yesterday' : `${index + 1}d ago`
}

function distanceFor(index: number) {
  return `${(0.7 + index * 0.4).toFixed(1)} km away`
}

function optionClass(isActive: boolean) {
  return `h-11 rounded-xl border px-4 text-xs font-bold ${
    isActive ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-slate-200 bg-white text-slate-600'
  }`
}

export function LostFoundBoard() {
  const [reports, setReports] = useState<LostFoundReport[]>(lostFoundReports)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUsingFallback, setIsUsingFallback] = useState(false)
  const [filter, setFilter] = useState<ReportFilter>('all')
  const [selectedId, setSelectedId] = useState(lostFoundReports[0]?.id ?? '')
  const [isReportFlowOpen, setIsReportFlowOpen] = useState(false)
  const [isAlertFlowOpen, setIsAlertFlowOpen] = useState(false)
  const [notifiedReportId, setNotifiedReportId] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadReports() {
      try {
        const response = await fetch('/api/lost-found', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('Could not load lost and found reports')
        }

        const payload = (await response.json()) as { reports?: ApiLostFoundReport[] }
        const apiReports = payload.reports ?? []

        if (!isMounted) return

        if (apiReports.length === 0) {
          setReports(lostFoundReports)
          setSelectedId(lostFoundReports[0]?.id ?? '')
          setIsUsingFallback(true)
          setError('No public reports returned yet. Showing fallback reports.')
          return
        }

        const nextReports = apiReports.map(toLostFoundReport)
        setReports(nextReports)
        setSelectedId(nextReports[0]?.id ?? '')
        setIsUsingFallback(false)
        setError(null)
      } catch {
        if (!isMounted) return
        setReports(lostFoundReports)
        setSelectedId(lostFoundReports[0]?.id ?? '')
        setIsUsingFallback(true)
        setError('Lost and found API is unavailable. Showing fallback reports.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadReports()

    return () => {
      isMounted = false
    }
  }, [])

  const visibleReports = useMemo(
    () => reports.filter((report) => report.status === 'open' && (filter === 'all' || report.report_type === filter)),
    [filter, reports],
  )

  const selectedReport = reports.find((report) => report.id === selectedId) ?? visibleReports[0]
  const matchedReport = selectedReport?.matched_report_id
    ? reports.find((report) => report.id === selectedReport.matched_report_id) ?? null
    : null
  const shouldShowVisionPanel = selectedReport?.report_type === 'found' && matchedReport && selectedReport.match_confidence

  function selectReport(report: LostFoundReport) {
    setSelectedId(report.id)
    setNotifiedReportId(null)
  }

  return (
    <div className="pb-20 md:pb-0">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.9fr)]">
        <section className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">Nearby pet reports</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Explore open lost and found reports around the community.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {isLoading ? <StatusBadge label="Loading" tone="amber" /> : null}
              {isUsingFallback ? <StatusBadge label="Fallback" tone="amber" /> : null}
              <StatusBadge label={`${visibleReports.length} open`} tone="purple" />
            </div>
          </div>

          <div className="mt-4 flex gap-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            {[
              ['all', 'All'],
              ['lost', 'Lost'],
              ['found', 'Found'],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value as ReportFilter)}
                className={optionClass(filter === value)}
              >
                {label}
              </button>
            ))}
          </div>

          {error ? (
            <div className="mt-4">
              <ErrorState title="Using fallback reports" description={error} />
            </div>
          ) : null}

          <div className="relative mt-4 min-h-[460px] overflow-hidden rounded-[1.75rem] border border-teal-100 bg-teal-50 shadow-xl shadow-teal-100/60">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,118,110,.12)_1px,transparent_1px),linear-gradient(rgba(15,118,110,.12)_1px,transparent_1px)] bg-[size:86px_86px]" />
            <div className="absolute left-[22%] top-[22%] h-24 w-36 rounded-3xl bg-teal-100/60 shadow-inner" />
            <div className="absolute left-[58%] top-[18%] h-28 w-32 rounded-3xl bg-white/45" />
            <div className="absolute left-[18%] top-[28%] h-40 w-40 rounded-full border border-dashed border-rose-500/80 bg-rose-50/20" />
            <div className="absolute left-[42%] top-[8%] h-[84%] w-3 rounded-full bg-white/70" />
            <div className="absolute left-[8%] top-[58%] h-3 w-[84%] rounded-full bg-white/70" />

            <Button
              onClick={() => setIsReportFlowOpen(true)}
              className="absolute right-4 top-4 shadow-lg shadow-violet-200"
              size="sm"
            >
              Report Pet
            </Button>

            {visibleReports.map((report, index) => {
              const position = markerPositions[index % markerPositions.length]
              const isSelected = selectedReport?.id === report.id
              return (
                <button
                  key={report.id}
                  onClick={() => selectReport(report)}
                  className={`absolute rounded-full border px-3 py-2 text-[11px] font-black shadow-lg transition duration-300 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-violet-100 ${
                    isSelected
                      ? 'scale-110 border-violet-300 bg-violet-600 text-white shadow-violet-300'
                      : 'border-white/70 bg-white/95 text-slate-700 hover:border-violet-200'
                  }`}
                  style={position}
                  aria-label={`Select ${report.report_type} report for ${report.pet_name}`}
                >
                  <span className="mr-1">{report.report_type === 'lost' ? 'Lost' : 'Found'}</span>
                  <span>{speciesIcon[report.species]}</span>
                </button>
              )
            })}

            <div className="absolute bottom-4 left-4 rounded-2xl border border-white/70 bg-white/90 p-3 text-[11px] shadow-sm backdrop-blur">
              <div className="font-bold text-rose-600">Lost pet</div>
              <div className="mt-1 font-bold text-teal-600">Found pet</div>
            </div>
          </div>

          <Card className="mt-4 rounded-[1.5rem]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-950">Open reports</h3>
                <p className="mt-1 text-xs text-slate-500">Swipe through active community reports.</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setIsAlertFlowOpen(true)} size="sm" variant="secondary">
                  Alerts
                </Button>
                <Button onClick={() => setIsReportFlowOpen(true)} size="sm" variant="secondary">
                  Report
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="mt-4">
                <LoadingState label="Loading nearby reports" />
              </div>
            ) : null}

            {!isLoading && visibleReports.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="No active reports"
                  description="Try another filter or submit a report to help the community."
                  action={<Button onClick={() => setIsReportFlowOpen(true)}>Report Pet</Button>}
                />
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {visibleReports.map((report, index) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  distance={distanceFor(index)}
                  timeAgo={timeAgoFor(index)}
                  selected={selectedReport?.id === report.id}
                  onSelect={() => selectReport(report)}
                />
              ))}
            </div>
          </Card>
        </section>

        <aside className="hidden lg:block">
          <ReportDetail
            report={selectedReport}
            matchedReport={matchedReport}
            shouldShowVisionPanel={Boolean(shouldShowVisionPanel)}
            notifiedReportId={notifiedReportId}
            onNotify={() => selectedReport && setNotifiedReportId(selectedReport.id)}
          />
        </aside>
      </div>

      {selectedReport ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white p-4 shadow-lg md:hidden">
          <ReportDetail
            report={selectedReport}
            matchedReport={matchedReport}
            shouldShowVisionPanel={Boolean(shouldShowVisionPanel)}
            notifiedReportId={notifiedReportId}
            onNotify={() => setNotifiedReportId(selectedReport.id)}
            compact
          />
        </div>
      ) : null}

      <ReportPetFlow open={isReportFlowOpen} onClose={() => setIsReportFlowOpen(false)} />
      <AlertSubscriptionFlow open={isAlertFlowOpen} onClose={() => setIsAlertFlowOpen(false)} />
    </div>
  )
}

function ReportCard({
  report,
  distance,
  timeAgo,
  selected,
  onSelect,
}: {
  report: LostFoundReport
  distance: string
  timeAgo: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button onClick={onSelect} className="text-left focus:outline-none focus:ring-4 focus:ring-violet-100">
      <article className={`group overflow-hidden rounded-[1.35rem] border bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl ${selected ? 'border-violet-400 ring-4 ring-violet-100' : 'border-slate-200 hover:border-violet-200'}`}>
        <div className="relative grid h-40 place-items-center bg-gradient-to-br from-violet-100 via-white to-teal-100">
          <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-black text-slate-700 shadow-sm">
            {speciesIcon[report.species]}
          </div>
          <div className="absolute right-3 top-3">
            <StatusBadge label={report.report_type} tone={reportTypeTone(report.report_type)} />
          </div>
          <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-black text-violet-700 shadow-sm">
            {distance}
          </div>
          <div className="grid h-20 w-20 place-items-center rounded-[1.75rem] bg-white/80 text-5xl font-black text-violet-700 shadow-sm transition group-hover:scale-105">
            {report.pet_name.slice(0, 1)}
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-black tracking-tight text-slate-950">{report.pet_name}</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">{report.location_notes}</p>
            </div>
            <p className="shrink-0 text-[11px] font-bold text-slate-400">{timeAgo}</p>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {report.breed} - {report.color} - {formatDate(report.created_at)}
          </p>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{report.description}</p>
        </div>
      </article>
    </button>
  )
}

function ReportDetail({
  report,
  matchedReport,
  shouldShowVisionPanel,
  notifiedReportId,
  onNotify,
  compact = false,
}: {
  report?: LostFoundReport
  matchedReport: LostFoundReport | null
  shouldShowVisionPanel: boolean
  notifiedReportId: string | null
  onNotify: () => void
  compact?: boolean
}) {
  if (!report) {
    return <EmptyState title="Select a report" description="Choose a map marker or report card to see details." />
  }

  return (
    <Card className={compact ? 'p-3' : 'sticky top-4 rounded-[1.5rem] border-violet-100 shadow-lg'}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-violet-600">Report detail</p>
          <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{report.pet_name}</h3>
          <p className="mt-1 text-xs text-slate-500">{report.location_notes}</p>
        </div>
        <StatusBadge label={report.report_type} tone={reportTypeTone(report.report_type)} />
      </div>

      {!compact ? (
        <div className="mt-4 grid h-44 place-items-center rounded-[1.35rem] bg-gradient-to-br from-violet-100 via-white to-teal-100 text-5xl font-black text-violet-700">
          {report.pet_name.slice(0, 1)}
        </div>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="font-bold text-slate-950">{speciesIcon[report.species]}</p>
          <p className="mt-1 text-slate-500">{report.breed}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="font-bold text-slate-950">{formatDate(report.created_at)}</p>
          <p className="mt-1 text-slate-500">1.2 km away</p>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{report.description}</p>

      {shouldShowVisionPanel && matchedReport ? (
        <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 p-3">
          <p className="text-sm font-black text-violet-900">Vision match found</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Possible match with {matchedReport.pet_name} at {report.match_confidence}% confidence.
          </p>
          {notifiedReportId === report.id ? (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
              Owner notified in mock workflow.
            </div>
          ) : (
            <Button onClick={onNotify} className="mt-3" fullWidth>
              Notify owner
            </Button>
          )}
        </div>
      ) : null}
    </Card>
  )
}
