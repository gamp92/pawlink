'use client'

import dynamic from 'next/dynamic'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { reportTypeTone, StatusBadge } from '@/components/shared/StatusBadge'
import { AlertSubscriptionFlow } from '@/components/public/lost-found/AlertSubscriptionFlow'
import { ReportPetFlow } from '@/components/public/lost-found/ReportPetFlow'
import { getPetDisplayImage } from '@/components/shared/pet-display-image'
import {
  lostFoundReports,
  type LostFoundReport,
  type ReportType,
  type Species,
} from '@/lib/mock-data'

type ReportFilter = 'all' | ReportType
type ReportSort = 'newest' | 'oldest' | 'name'

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

type ApiLocation =
  | LostFoundReport['location']
  | { latitude?: number | string; longitude?: number | string }
  | { coordinates?: [number, number] }
  | string
  | null

const ReportMap = dynamic(() => import('@/components/public/lost-found/map/ReportMap'), {
  ssr: false,
  loading: () => (
    <div className="pawlink-map-shell pawlink-report-map">
      <div className="pawlink-map-skeleton">
        <div className="pawlink-map-overlay left-3 top-3 rounded-2xl border border-white/80 bg-white/90 p-3 text-xs font-black text-slate-600 shadow-sm">
          Loading map
        </div>
      </div>
    </div>
  ),
})

const speciesIcon: Record<Species, string> = {
  dog: 'Dog',
  cat: 'Cat',
  other: 'Pet',
}

const visualFallbackLocations: LostFoundReport['location'][] = [
  { lat: 19.4129, lng: -99.1727 },
  { lat: 19.4141, lng: -99.1704 },
  { lat: 19.4118, lng: -99.1742 },
  { lat: 19.4162, lng: -99.1688 },
  { lat: 19.4098, lng: -99.1763 },
  { lat: 19.4182, lng: -99.1749 },
]

function isValidCoordinate(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  )
}

function fallbackLocationFor(index: number) {
  return visualFallbackLocations[index % visualFallbackLocations.length]
}

function parseApiLocation(location: ApiLocation, index: number): LostFoundReport['location'] {
  if (!location) return fallbackLocationFor(index)

  if (typeof location === 'string') {
    const match = location.match(/POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)/i)
    if (match) {
      const lng = Number(match[1])
      const lat = Number(match[2])
      if (isValidCoordinate(lat, lng)) return { lat, lng }
    }

    return fallbackLocationFor(index)
  }

  if ('coordinates' in location && Array.isArray(location.coordinates)) {
    const [lng, lat] = location.coordinates.map(Number)
    if (isValidCoordinate(lat, lng)) return { lat, lng }
  }

  if ('lat' in location && 'lng' in location) {
    const lat = Number(location.lat)
    const lng = Number(location.lng)
    if (isValidCoordinate(lat, lng)) return { lat, lng }
  }

  if ('latitude' in location && 'longitude' in location) {
    const lat = Number(location.latitude)
    const lng = Number(location.longitude)
    if (isValidCoordinate(lat, lng)) return { lat, lng }
  }

  return fallbackLocationFor(index)
}

function toLostFoundReport(apiReport: ApiLostFoundReport, index: number): LostFoundReport {
  return {
    id: apiReport.id,
    report_type: apiReport.report_type,
    pet_name: apiReport.pet_name ?? (apiReport.report_type === 'found' ? 'Unknown pet' : 'Unnamed pet'),
    species: apiReport.species ?? 'other',
    breed: apiReport.breed ?? 'Mixed',
    color: apiReport.color ?? 'unknown',
    description: apiReport.description ?? 'No description provided yet.',
    photo_urls: apiReport.photo_urls ?? [],
    location: parseApiLocation(apiReport.location, index),
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
  return `pawlink-filter-chip ${
    isActive ? 'pawlink-filter-chip-active' : ''
  }`
}

function reportMatchesQuery(report: LostFoundReport, query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true
  return [
    report.pet_name,
    report.species,
    report.breed,
    report.color,
    report.location_notes,
    report.city,
    report.description,
    report.report_type,
  ]
    .join(' ')
    .toLowerCase()
    .includes(normalizedQuery)
}

export function LostFoundBoard() {
  const [reports, setReports] = useState<LostFoundReport[]>(lostFoundReports)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUsingFallback, setIsUsingFallback] = useState(false)
  const [filter, setFilter] = useState<ReportFilter>('all')
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<ReportSort>('newest')
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
    () => {
      const filteredReports = reports.filter(
        (report) =>
          report.status === 'open' &&
          (filter === 'all' || report.report_type === filter) &&
          reportMatchesQuery(report, query),
      )

      return [...filteredReports].sort((first, second) => {
        if (sortBy === 'name') return first.pet_name.localeCompare(second.pet_name)
        if (sortBy === 'oldest') return Date.parse(first.created_at) - Date.parse(second.created_at)
        return Date.parse(second.created_at) - Date.parse(first.created_at)
      })
    },
    [filter, query, reports, sortBy],
  )

  const selectedReport = visibleReports.find((report) => report.id === selectedId) ?? visibleReports[0]
  const matchedReport = selectedReport?.matched_report_id
    ? reports.find((report) => report.id === selectedReport.matched_report_id) ?? null
    : null

  function selectReport(report: LostFoundReport) {
    setSelectedId(report.id)
    setNotifiedReportId(null)
  }

  function handleReportSubmitted(report: LostFoundReport) {
    setReports((currentReports) => [
      report,
      ...currentReports.filter((item) => item.id !== report.id),
    ])
    setSelectedId(report.id)
    setFilter('all')
    setQuery('')
    setSortBy('newest')
    setNotifiedReportId(null)
  }

  useEffect(() => {
    if (!visibleReports.length) return
    if (!visibleReports.some((report) => report.id === selectedId)) {
      setSelectedId(visibleReports[0].id)
    }
  }, [selectedId, visibleReports])

  useEffect(() => {
    const selectedCard = document.getElementById(`lost-found-report-${selectedReport?.id ?? ''}`)
    selectedCard?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [selectedReport?.id])

  function clearDiscoveryFilters() {
    setFilter('all')
    setQuery('')
    setSortBy('newest')
  }

  const hasActiveDiscoveryFilters = filter !== 'all' || query.trim() || sortBy !== 'newest'

  return (
    <div className="mx-auto max-w-[1400px] pb-20 md:pb-0">
      <div className="mb-5">
        <div>
          <p className="text-sm font-bold text-violet-700">Lost & Found</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Find nearby pet reports</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Explore community reports on the map, filter by lost or found, and help pets get home.
          </p>
        </div>
      </div>

      <div className="pawlink-discovery-toolbar mb-4">
        <div className="pawlink-search-shell">
          <label className="block" htmlFor="lost-found-search">
            <span className="sr-only">Search lost and found reports</span>
            <div className="pawlink-search-field">
              <span aria-hidden="true" className="pawlink-search-icon">⌕</span>
              <input
                id="lost-found-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search reports, pets, locations..."
                className="pawlink-search-input"
              />
              {query ? (
                <button type="button" onClick={() => setQuery('')} className="pawlink-search-clear" aria-label="Clear search">
                  x
                </button>
              ) : null}
            </div>
          </label>
          <p className="mt-2 text-xs text-slate-500">Try “golden”, “cat”, “park”, or “found”.</p>
        </div>

        <div className="pawlink-toolbar-row">
          <div className="pawlink-filter-row" aria-label="Report filters">
            {[
              ['all', 'All', 'Map'],
              ['lost', 'Lost', 'L'],
              ['found', 'Found', 'F'],
            ].map(([value, label, icon]) => {
              const selected = filter === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value as ReportFilter)}
                  aria-pressed={selected}
                  className={optionClass(selected)}
                >
                  <span aria-hidden="true">{selected ? '✓' : icon}</span>
                  {label}
                </button>
              )
            })}
          </div>

          <div className="pawlink-toolbar-actions">
            <div className="flex shrink-0 items-center gap-2">
              {isLoading ? <StatusBadge label="Loading" tone="amber" /> : null}
              {isUsingFallback ? <StatusBadge label="Fallback data" tone="amber" /> : null}
              <StatusBadge label={`${visibleReports.length} results`} tone="purple" />
            </div>

            <label className="pawlink-sort-control">
              <span>Sort</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as ReportSort)}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name">Name</option>
              </select>
            </label>

            {hasActiveDiscoveryFilters ? (
              <button type="button" onClick={clearDiscoveryFilters} className="pawlink-clear-filters">
                Clear filters
              </button>
            ) : null}

            <Button onClick={() => setIsAlertFlowOpen(true)} variant="secondary">Get alerts</Button>
            <div className="hidden lg:block">
              <Button onClick={() => setIsReportFlowOpen(true)}>Report a pet</Button>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-4">
          <ErrorState title="Using fallback reports" description={error} />
        </div>
      ) : null}

      <div className="pawlink-explorer-grid">
        <section className="min-w-0">
          <div className="relative">
            <ReportMap reports={visibleReports} selectedReportId={selectedReport?.id ?? ''} onSelectReport={selectReport} />
            <div className="pointer-events-none absolute bottom-4 right-4 z-[500] lg:hidden">
              <Button
                onClick={() => setIsReportFlowOpen(true)}
                className="pointer-events-auto shadow-lg shadow-violet-200"
                size="sm"
              >
                Report a pet
              </Button>
            </div>
          </div>
        </section>

        <aside className="min-w-0">
          <Card className="pawlink-report-list-shell rounded-[1.5rem] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black tracking-tight text-slate-950">Open reports</h3>
                <p className="mt-1 text-sm text-slate-500">Select a report to focus its map marker.</p>
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
                  action={<Button onClick={() => setIsReportFlowOpen(true)}>Report a pet</Button>}
                />
              </div>
            ) : null}

            <div className="pawlink-report-list mt-4">
              {visibleReports.map((report, index) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  distance={distanceFor(index)}
                  timeAgo={timeAgoFor(index)}
                  selected={selectedReport?.id === report.id}
                  onSelect={() => selectReport(report)}
                  onNotify={() => setNotifiedReportId(report.id)}
                  matchedReport={report.matched_report_id ? reports.find((item) => item.id === report.matched_report_id) ?? null : null}
                  notified={notifiedReportId === report.id}
                />
              ))}
            </div>
          </Card>
        </aside>
      </div>

      <ReportPetFlow
        open={isReportFlowOpen}
        onClose={() => setIsReportFlowOpen(false)}
        onSubmitted={handleReportSubmitted}
      />
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
  onNotify,
  matchedReport,
  notified,
}: {
  report: LostFoundReport
  distance: string
  timeAgo: string
  selected: boolean
  onSelect: () => void
  onNotify: () => void
  matchedReport: LostFoundReport | null
  notified: boolean
}) {
  const imageUrl = getPetDisplayImage(report)
  const petName = report.pet_name || 'Unknown pet'
  const showVision = selected && report.report_type === 'found' && matchedReport && report.match_confidence

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.currentTarget !== event.target) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect()
    }
  }

  return (
    <article
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`Select ${report.report_type} report for ${petName}`}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      id={`lost-found-report-${report.id}`}
      className="pawlink-report-card-button pawlink-report-card focus:outline-none focus:ring-4 focus:ring-violet-100"
      data-selected={selected ? 'true' : undefined}
    >
        <div className="pawlink-photo-frame pawlink-report-thumb">
          <img src={imageUrl} alt={`${petName}, ${report.species} ${report.report_type} report`} className="pawlink-pet-photo" />
          <div className="pawlink-report-overlay-top">
            <StatusBadge label={report.report_type} tone={reportTypeTone(report.report_type)} />
          </div>
          <div className="pawlink-report-overlay-bottom">
            <span>{distance}</span>
          </div>
        </div>
        <div className="pawlink-report-content min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-xl font-black leading-7 text-slate-950">{petName}</h3>
              <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                {speciesIcon[report.species]} · {report.breed}
              </p>
            </div>
            <span className="pawlink-report-date-chip">{timeAgo}</span>
          </div>

          <p className="mt-3 truncate text-sm font-bold text-slate-700">
            {report.location_notes}
          </p>

          <div className="pawlink-report-meta-row">
            <span className="pawlink-report-chip">{formatDate(report.created_at)}</span>
            <span className="pawlink-report-chip">{report.color}</span>
            <span className="pawlink-report-chip">{report.city}</span>
          </div>

          <p className="pawlink-report-description">{report.description}</p>

          <div className="pawlink-selected-details text-left">
            {showVision ? (
              <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 p-3">
                <p className="text-sm font-black text-violet-900">Vision match found</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Possible match with {matchedReport.pet_name} at {report.match_confidence}% confidence.
                </p>
                {notified ? (
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
                    Owner notified in mock workflow.
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      onNotify()
                    }}
                    className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl border border-violet-600 bg-violet-600 px-3 text-xs font-black text-white"
                  >
                    Notify owner
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
    </article>
  )
}
