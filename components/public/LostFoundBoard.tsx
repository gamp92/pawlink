'use client'

import { useMemo, useState } from 'react'
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
  { left: '46%', top: '39%' },
  { left: '39%', top: '50%' },
  { left: '55%', top: '48%' },
  { left: '27%', top: '58%' },
]

export function LostFoundBoard() {
  const [reports, setReports] = useState<LostFoundReport[]>(lostFoundReports)
  const [filter, setFilter] = useState<ReportFilter>('all')
  const [selectedId, setSelectedId] = useState(lostFoundReports[0]?.id ?? '')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState<ReportForm>(initialForm)
  const [notifiedReportId, setNotifiedReportId] = useState<string | null>(null)

  const visibleReports = useMemo(
    () => reports.filter((report) => report.status === 'open' && (filter === 'all' || report.report_type === filter)),
    [filter, reports],
  )
  const selectedReport = reports.find((report) => report.id === selectedId) ?? visibleReports[0]
  const matchedReport = selectedReport?.matched_report_id
    ? reports.find((report) => report.id === selectedReport.matched_report_id)
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
    <div className="grid gap-4 md:grid-cols-[1fr_170px]">
      <section>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">Community reports</h2>
            <p className="mt-1 text-xs text-slate-500">Static map mock with local report filtering and selection.</p>
          </div>
          <StatusBadge label={`${visibleReports.length} open`} tone="purple" />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ['all', 'All reports'],
            ['lost', 'Lost'],
            ['found', 'Found'],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value as ReportFilter)}
              className={`rounded-full border px-3 py-1 text-[11px] font-bold ${
                filter === value
                  ? 'border-violet-300 bg-violet-50 text-violet-700'
                  : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-3 relative min-h-[255px] overflow-hidden rounded-lg border border-teal-100 bg-teal-50">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,118,110,.12)_1px,transparent_1px),linear-gradient(rgba(15,118,110,.12)_1px,transparent_1px)] bg-[size:86px_86px]" />
          <div className="absolute left-[22%] top-[22%] h-24 w-36 rounded bg-teal-100/60" />
          <div className="absolute left-[18%] top-[28%] h-36 w-36 rounded-full border border-dashed border-rose-500" />

          {visibleReports.map((report, index) => {
            const position = markerPositions[index % markerPositions.length]
            return (
              <button
                key={report.id}
                onClick={() => selectReport(report)}
                className={`absolute rounded bg-white px-2 py-1 text-[11px] font-bold shadow-sm ${
                  selectedReport?.id === report.id ? 'border border-violet-300 text-violet-700' : ''
                }`}
                style={position}
              >
                <span className={report.report_type === 'lost' ? 'text-rose-600' : 'text-teal-600'}>
                  {report.report_type}
                </span>{' '}
                - {report.species}
              </button>
            )
          })}

          <div className="absolute bottom-3 left-3 rounded bg-white p-2 text-[11px] shadow-sm">
            <div className="text-rose-600">Lost pet</div>
            <div className="text-teal-600">Found pet</div>
          </div>

          <div className="absolute bottom-3 right-3 rounded border border-teal-200 bg-white p-3 shadow-sm">
            <p className="text-xs font-bold">Geo-alert mock</p>
            <p className="mt-1 text-[11px] text-slate-500">14 nearby neighbors alerted</p>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Active reports</h3>
            <button onClick={() => setIsFormOpen(true)} className="rounded bg-violet-600 px-3 py-2 text-xs font-bold text-white">
              + Report a pet
            </button>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {visibleReports.map((report) => (
              <button
                key={report.id}
                onClick={() => selectReport(report)}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold">{report.pet_name}</p>
                  <StatusBadge label={report.report_type} tone={reportTypeTone(report.report_type)} />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {report.color} - {report.location_notes}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <aside>
        {selectedReport ? (
          <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold">Report detail</h3>
              <StatusBadge label={selectedReport.report_type} tone={reportTypeTone(selectedReport.report_type)} />
            </div>

            <div className="mt-3 grid h-20 place-items-center rounded bg-violet-50 text-2xl">
              {selectedReport.species}
            </div>

            <h4 className="mt-3 text-lg font-black tracking-tight">{selectedReport.pet_name}</h4>
            <p className="mt-1 text-xs text-slate-500">
              {selectedReport.breed} - {selectedReport.color}
            </p>
            <p className="mt-3 text-xs leading-5 text-slate-600">{selectedReport.description}</p>
            <p className="mt-3 rounded border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-500">
              {selectedReport.location_notes}
            </p>
          </section>
        ) : null}

        {shouldShowVisionPanel && matchedReport ? (
          <section className="mt-3 rounded-lg border border-violet-200 bg-white p-3 shadow-sm">
            <h3 className="text-sm font-bold">Vision match found</h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="grid h-12 place-items-center rounded bg-teal-50 text-xs">Found</div>
              <div className="grid h-12 place-items-center rounded bg-rose-50 text-xs">Lost</div>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              Possible match with {matchedReport.pet_name} at {selectedReport.match_confidence}% confidence.
            </p>
            {notifiedReportId === selectedReport.id ? (
              <div className="mt-3 rounded border border-emerald-200 bg-emerald-50 p-2 text-xs font-bold text-emerald-700">
                Owner notified in mock workflow.
              </div>
            ) : (
              <button
                onClick={() => setNotifiedReportId(selectedReport.id)}
                className="mt-3 w-full rounded bg-violet-600 py-2 text-xs font-bold text-white"
              >
                Notify owner
              </button>
            )}
          </section>
        ) : null}
      </aside>

      {isFormOpen ? (
        <div className="fixed inset-0 grid place-items-center bg-slate-950/40 p-6">
          <div className="w-full max-w-[520px] rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black tracking-tight">Report a pet</h3>
              <button onClick={() => setIsFormOpen(false)} className="rounded border border-slate-200 px-3 py-1 text-xs font-bold text-slate-500">
                Close
              </button>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <select
                value={form.report_type}
                onChange={(event) => updateForm('report_type', event.target.value as ReportType)}
                className="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              >
                <option value="lost">Lost pet</option>
                <option value="found">Found pet</option>
              </select>
              <select
                value={form.species}
                onChange={(event) => updateForm('species', event.target.value as Species)}
                className="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              >
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
                <option value="other">Other</option>
              </select>
              <input
                value={form.pet_name}
                onChange={(event) => updateForm('pet_name', event.target.value)}
                placeholder="Pet name"
                className="rounded border border-slate-200 px-3 py-2 text-sm text-slate-950"
              />
              <input
                value={form.breed}
                onChange={(event) => updateForm('breed', event.target.value)}
                placeholder="Breed"
                className="rounded border border-slate-200 px-3 py-2 text-sm text-slate-950"
              />
              <input
                value={form.color}
                onChange={(event) => updateForm('color', event.target.value)}
                placeholder="Color"
                className="rounded border border-slate-200 px-3 py-2 text-sm text-slate-950"
              />
              <input
                value={form.location_notes}
                onChange={(event) => updateForm('location_notes', event.target.value)}
                placeholder="Location notes"
                className="rounded border border-slate-200 px-3 py-2 text-sm text-slate-950"
              />
            </div>

            <textarea
              value={form.description}
              onChange={(event) => updateForm('description', event.target.value)}
              placeholder="Description"
              className="mt-3 w-full rounded border border-slate-200 px-3 py-2 text-sm text-slate-950"
              rows={4}
            />

            <div className="mt-3 rounded border border-teal-200 bg-teal-50 p-3 text-xs text-slate-600">
              Location will be pinned on the mock map. Real GPS and Leaflet come later.
            </div>

            <button onClick={submitReport} className="mt-3 w-full rounded bg-violet-600 px-3 py-2 text-xs font-bold text-white">
              Submit mock report
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
