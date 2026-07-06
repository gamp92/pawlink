'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { reportTypeTone, StatusBadge } from '@/components/shared/StatusBadge'
import {
  lostFoundReports,
  type LostFoundReport,
  type ReportType,
  type Species,
} from '@/lib/mock-data'

type ReportFilter = 'all' | ReportType
type ReportForm = {
  report_type: ReportType
  pet_name: string
  species: Species
  breed: string
  color: string
  description: string
  location_notes: string
}

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

const initialForm: ReportForm = {
  report_type: 'lost',
  pet_name: '',
  species: 'dog',
  breed: '',
  color: '',
  description: '',
  location_notes: 'Near Parque Mexico, Condesa',
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
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState<ReportForm>(initialForm)
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

  function updateForm<Key extends keyof ReportForm>(key: Key, value: ReportForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function submitReport() {
    const newReport: LostFoundReport = {
      id: `report-local-${reports.length + 1}`,
      report_type: form.report_type,
      pet_name: form.pet_name.trim() || (form.report_type === 'found' ? 'Unknown pet' : 'Unnamed pet'),
      species: form.species,
      breed: form.breed.trim() || 'Mixed',
      color: form.color.trim() || 'unknown',
      description: form.description.trim() || 'Reported from the public Lost & Found form.',
      photo_urls: [''],
      location: { lat: 19.4133, lng: -99.1718 },
      location_notes: form.location_notes.trim() || 'Pinned on mock map',
      city: 'CDMX',
      status: 'open',
      matched_report_id: null,
      match_confidence: null,
      created_at: '2025-06-14T00:00:00Z',
    }

    setReports((current) => [newReport, ...current])
    setSelectedId(newReport.id)
    setFilter(newReport.report_type)
    setForm(initialForm)
    setIsFormOpen(false)
    setNotifiedReportId(null)
  }

  return (
    <div className="pb-20 md:pb-0">
      <div className="grid gap-5 md:grid-cols-2">
        <section className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-950">Nearby pet reports</h2>
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

          <div className="mt-4 flex gap-2">
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

          <div className="relative mt-4 min-h-[320px] overflow-hidden rounded-2xl border border-teal-100 bg-teal-50 shadow-sm">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,118,110,.12)_1px,transparent_1px),linear-gradient(rgba(15,118,110,.12)_1px,transparent_1px)] bg-[size:86px_86px]" />
            <div className="absolute left-[22%] top-[22%] h-24 w-36 rounded bg-teal-100/60" />
            <div className="absolute left-[18%] top-[28%] h-36 w-36 rounded-full border border-dashed border-rose-500" />

            <Button
              onClick={() => setIsFormOpen(true)}
              className="absolute right-3 top-0"
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
                  className={`absolute rounded-full border px-3 py-2 text-[11px] font-black shadow-sm ${
                    isSelected
                      ? 'border-violet-300 bg-violet-600 text-white'
                      : 'border-white/60 bg-white/90 text-slate-700'
                  }`}
                  style={position}
                >
                  {report.report_type === 'lost' ? 'Lost' : 'Found'} - {speciesIcon[report.species]}
                </button>
              )
            })}

            <div className="absolute bottom-3 left-3 rounded-xl border border-white/60 bg-white/90 p-3 text-[11px] shadow-sm">
              <div className="font-bold text-rose-600">Lost pet</div>
              <div className="mt-1 font-bold text-teal-600">Found pet</div>
            </div>
          </div>

          <Card className="mt-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-950">Open reports</h3>
                <p className="mt-1 text-xs text-slate-500">Swipe through active community reports.</p>
              </div>
              <Button onClick={() => setIsFormOpen(true)} size="sm" variant="secondary">
                Report
              </Button>
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
                  action={<Button onClick={() => setIsFormOpen(true)}>Report Pet</Button>}
                />
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {visibleReports.map((report, index) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  distance={distanceFor(index)}
                  selected={selectedReport?.id === report.id}
                  onSelect={() => selectReport(report)}
                />
              ))}
            </div>
          </Card>
        </section>

        <aside className="hidden md:block">
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

      {isFormOpen ? (
        <div className="fixed inset-0 z-40 bg-white p-4 md:grid md:place-items-center md:bg-slate-950/40">
          <div className="mx-auto w-full max-w-[520px] rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-violet-600">Community report</p>
                <h3 className="mt-1 text-2xl font-black tracking-tight">Report a pet</h3>
              </div>
              <Button onClick={() => setIsFormOpen(false)} variant="secondary" size="sm">
                Close
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                ['lost', 'Lost pet'],
                ['found', 'Found pet'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => updateForm('report_type', value as ReportType)}
                  className={optionClass(form.report_type === value)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                ['dog', 'Dog'],
                ['cat', 'Cat'],
                ['other', 'Other'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => updateForm('species', value as Species)}
                  className={optionClass(form.species === value)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                value={form.pet_name}
                onChange={(event) => updateForm('pet_name', event.target.value)}
                placeholder="Pet name"
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-950"
              />
              <input
                value={form.breed}
                onChange={(event) => updateForm('breed', event.target.value)}
                placeholder="Breed"
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-950"
              />
              <input
                value={form.color}
                onChange={(event) => updateForm('color', event.target.value)}
                placeholder="Color"
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-950"
              />
              <input
                value={form.location_notes}
                onChange={(event) => updateForm('location_notes', event.target.value)}
                placeholder="Location notes"
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-950"
              />
            </div>

            <textarea
              value={form.description}
              onChange={(event) => updateForm('description', event.target.value)}
              placeholder="Description"
              className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-950"
              rows={4}
            />

            <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50 p-3 text-xs text-slate-600">
              Location will be pinned on the mock map. Real GPS and Leaflet come later.
            </div>

            <Button onClick={submitReport} className="mt-4" size="lg" fullWidth>
              Submit report
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ReportCard({
  report,
  distance,
  selected,
  onSelect,
}: {
  report: LostFoundReport
  distance: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button onClick={onSelect} className="text-left">
      <article className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${selected ? 'border-violet-300' : 'border-slate-200'}`}>
        <div className="relative grid h-36 place-items-center bg-gradient-to-br from-violet-50 to-teal-50">
          <div className="absolute left-3 top-0 rounded-full bg-white/90 px-3 py-1 text-[11px] font-black text-slate-700">
            {speciesIcon[report.species]}
          </div>
          <div className="absolute right-3 top-0">
            <StatusBadge label={report.report_type} tone={reportTypeTone(report.report_type)} />
          </div>
          <div className="text-4xl font-black text-violet-700">{report.pet_name.slice(0, 1)}</div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-black tracking-tight text-slate-950">{report.pet_name}</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">{report.location_notes}</p>
            </div>
            <p className="shrink-0 text-[11px] font-bold text-violet-700">{distance}</p>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {report.breed} - {report.color} - {formatDate(report.created_at)}
          </p>
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
    <Card className={compact ? 'p-3' : ''}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Report detail</p>
          <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{report.pet_name}</h3>
          <p className="mt-1 text-xs text-slate-500">{report.location_notes}</p>
        </div>
        <StatusBadge label={report.report_type} tone={reportTypeTone(report.report_type)} />
      </div>

      {!compact ? (
        <div className="mt-4 grid h-36 place-items-center rounded-2xl bg-gradient-to-br from-violet-50 to-teal-50 text-4xl font-black text-violet-700">
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
