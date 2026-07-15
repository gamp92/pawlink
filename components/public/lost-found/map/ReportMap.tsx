'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { reportTypeTone, StatusBadge } from '@/components/shared/StatusBadge'
import { getPetDisplayImage } from '@/components/shared/pet-display-image'
import type { LostFoundReport, ReportType } from '@/lib/mock-data'
import {
  clusterMarkerIcon,
  configureLeafletDefaultIcons,
  reportMarkerIcon,
  userLocationIcon,
} from '@/components/public/lost-found/map/leaflet-icons'

const defaultCenter: [number, number] = [19.4133, -99.1718]
const defaultZoom = 14
const searchRadiusMeters = 1800
const clusterThreshold = 8

type ReportMapProps = {
  reports: LostFoundReport[]
  selectedReportId: string
  onSelectReport: (report: LostFoundReport) => void
}

type UserLocation = {
  lat: number
  lng: number
}

type MapFilter = 'all' | ReportType

type ReportCluster = {
  id: string
  reports: LostFoundReport[]
  lat: number
  lng: number
}

function hasValidLocation(report: LostFoundReport) {
  const { lat, lng } = report.location
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
}

function fitReports(map: L.Map, reports: LostFoundReport[], animate = true) {
  const coordinates = reports
    .filter(hasValidLocation)
    .map((report) => [report.location.lat, report.location.lng] as [number, number])

  if (coordinates.length === 0) {
    map.flyTo(defaultCenter, defaultZoom, { duration: animate ? 0.7 : 0 })
    return
  }

  if (coordinates.length === 1) {
    map.flyTo(coordinates[0], 15, { duration: animate ? 0.7 : 0 })
    return
  }

  map.flyToBounds(L.latLngBounds(coordinates), {
    padding: [52, 52],
    maxZoom: 15,
    duration: animate ? 0.7 : 0,
  })
}

function formatDate(value: string) {
  return value.slice(0, 10)
}

function distanceFor(index: number) {
  return `${(0.7 + index * 0.4).toFixed(1)} km away`
}

function buildClusters(reports: LostFoundReport[]) {
  if (reports.length < clusterThreshold) {
    return reports.map((report) => ({
      id: report.id,
      reports: [report],
      lat: report.location.lat,
      lng: report.location.lng,
    }))
  }

  const groups = new Map<string, LostFoundReport[]>()
  reports.forEach((report) => {
    const key = `${report.location.lat.toFixed(2)}:${report.location.lng.toFixed(2)}`
    groups.set(key, [...(groups.get(key) ?? []), report])
  })

  return Array.from(groups.entries()).map(([key, clusterReports]) => {
    const lat = clusterReports.reduce((sum, report) => sum + report.location.lat, 0) / clusterReports.length
    const lng = clusterReports.reduce((sum, report) => sum + report.location.lng, 0) / clusterReports.length
    return { id: key, reports: clusterReports, lat, lng }
  })
}

function FitInitialBounds({ reports }: { reports: LostFoundReport[] }) {
  const map = useMap()
  const didFit = useRef(false)

  useEffect(() => {
    if (didFit.current) return

    fitReports(map, reports, false)
    didFit.current = true
  }, [map, reports])

  return null
}

function FlyToSelected({ report }: { report?: LostFoundReport }) {
  const map = useMap()
  const previousId = useRef<string | null>(null)

  useEffect(() => {
    if (!report || !hasValidLocation(report) || previousId.current === report.id) return
    previousId.current = report.id
    map.flyTo([report.location.lat, report.location.lng], Math.max(map.getZoom(), 15), {
      duration: 0.7,
    })
  }, [map, report])

  return null
}

function FlyToUserLocation({ location }: { location: UserLocation | null }) {
  const map = useMap()

  useEffect(() => {
    if (!location) return
    map.flyTo([location.lat, location.lng], 15, { duration: 0.7 })
  }, [location, map])

  return null
}

function InvalidateMapSize() {
  const map = useMap()

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      map.invalidateSize()
    })
    const timeout = window.setTimeout(() => {
      map.invalidateSize()
    }, 250)

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timeout)
    }
  }, [map])

  return null
}

function MapControls({
  reports,
  selectedReport,
  onLocate,
  onRetry,
  isLocating,
  hasError,
}: {
  reports: LostFoundReport[]
  selectedReport?: LostFoundReport
  onLocate: () => void
  onRetry: () => void
  isLocating: boolean
  hasError: boolean
}) {
  const map = useMap()

  return (
    <div className="pawlink-map-control-stack">
      <div className="pawlink-map-control-group" aria-label="Map zoom controls">
        <button type="button" className="pawlink-map-control-button" onClick={() => map.zoomIn()} aria-label="Zoom in">
          +
        </button>
        <button type="button" className="pawlink-map-control-button" onClick={() => map.zoomOut()} aria-label="Zoom out">
          -
        </button>
      </div>
      <div className="pawlink-map-control-group" aria-label="Map view controls">
        <button
          type="button"
          className="pawlink-map-control-button"
          onClick={() => {
            if (selectedReport && hasValidLocation(selectedReport)) {
              map.flyTo([selectedReport.location.lat, selectedReport.location.lng], Math.max(map.getZoom(), 15), { duration: 0.7 })
            }
          }}
          disabled={!selectedReport}
          aria-label="Center selected report"
        >
          ⌖
        </button>
        <button type="button" className="pawlink-map-control-button" onClick={onLocate} disabled={isLocating} aria-label="Locate me">
          {isLocating ? '...' : '◎'}
        </button>
        <button type="button" className="pawlink-map-control-button" onClick={() => fitReports(map, reports)} aria-label="Reset map view">
          ↺
        </button>
        {hasError ? (
          <button type="button" className="pawlink-map-control-button" onClick={onRetry} aria-label="Retry map tiles">
            ↻
          </button>
        ) : null}
      </div>
    </div>
  )
}

function FloatingMapFilters({
  value,
  onChange,
  count,
}: {
  value: MapFilter
  onChange: (value: MapFilter) => void
  count: number
}) {
  return (
    <div className="pawlink-map-filter-panel">
      <div className="pawlink-map-count">{count} reports</div>
      <div className="pawlink-map-filter-row" aria-label="Map report filters">
        {[
          ['all', 'All'],
          ['lost', 'Lost'],
          ['found', 'Found'],
        ].map(([optionValue, label]) => {
          const selected = value === optionValue
          return (
            <button
              key={optionValue}
              type="button"
              onClick={() => onChange(optionValue as MapFilter)}
              aria-pressed={selected}
              data-selected={selected}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ReportMarker({
  report,
  selected,
  hovered,
  onSelect,
  onHoverChange,
}: {
  report: LostFoundReport
  selected: boolean
  hovered: boolean
  onSelect: () => void
  onHoverChange: (hovered: boolean) => void
}) {
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    const markerElement = markerRef.current?.getElement()
    if (!markerElement) return

    function handleFocus() {
      onHoverChange(true)
    }

    function handleBlur() {
      onHoverChange(false)
    }

    markerElement.addEventListener('focus', handleFocus)
    markerElement.addEventListener('blur', handleBlur)

    return () => {
      markerElement.removeEventListener('focus', handleFocus)
      markerElement.removeEventListener('blur', handleBlur)
    }
  }, [onHoverChange])

  useEffect(() => {
    if (hovered || selected) {
      markerRef.current?.openPopup()
    } else {
      markerRef.current?.closePopup()
    }
  }, [hovered, selected])

  const imageUrl = getPetDisplayImage(report)

  return (
    <Marker
      ref={markerRef}
      position={[report.location.lat, report.location.lng]}
      icon={reportMarkerIcon(report.report_type, selected, hovered)}
      title={`${report.report_type} report for ${report.pet_name}`}
      alt={`${report.report_type} report for ${report.pet_name}`}
      zIndexOffset={selected ? 1000 : 0}
      keyboard
      eventHandlers={{
        click: onSelect,
        mouseover: () => {
          onHoverChange(true)
          markerRef.current?.openPopup()
        },
        mouseout: () => {
          onHoverChange(false)
          if (!selected) markerRef.current?.closePopup()
        },
      }}
    >
      <Popup>
        <div className="pawlink-map-popup">
          <img src={imageUrl} alt={`${report.pet_name} report`} />
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2">
              <strong>{report.pet_name}</strong>
              <StatusBadge label={report.report_type} tone={reportTypeTone(report.report_type)} />
            </div>
            <p>{formatDate(report.created_at)} · {distanceFor(0)}</p>
            <p>{report.location_notes}</p>
            <button type="button" onClick={onSelect}>View report</button>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

function ClusterMarker({
  cluster,
  onSelectReport,
}: {
  cluster: ReportCluster
  onSelectReport: (report: LostFoundReport) => void
}) {
  const map = useMap()

  return (
    <Marker
      position={[cluster.lat, cluster.lng]}
      icon={clusterMarkerIcon(cluster.reports.length)}
      title={`${cluster.reports.length} nearby reports`}
      alt={`${cluster.reports.length} nearby reports`}
      eventHandlers={{
        click: () => {
          if (cluster.reports.length === 1) {
            onSelectReport(cluster.reports[0])
            return
          }

          const bounds = L.latLngBounds(cluster.reports.map((report) => [report.location.lat, report.location.lng] as [number, number]))
          map.flyToBounds(bounds, { padding: [56, 56], maxZoom: 17, duration: 0.7 })
        },
      }}
    >
      <Popup>
        <div className="pawlink-map-cluster-popup">
          <strong>{cluster.reports.length} nearby reports</strong>
          <p>Zoom in to see each pet report.</p>
        </div>
      </Popup>
    </Marker>
  )
}

export default function ReportMap({ reports, selectedReportId, onSelectReport }: ReportMapProps) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [locationMessage, setLocationMessage] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [tileLayerKey, setTileLayerKey] = useState(0)
  const [hoveredReportId, setHoveredReportId] = useState<string | null>(null)
  const [mapFilter, setMapFilter] = useState<MapFilter>('all')

  useEffect(() => {
    configureLeafletDefaultIcons()
  }, [])

  const visibleReports = useMemo(
    () => reports.filter((report) => hasValidLocation(report) && (mapFilter === 'all' || report.report_type === mapFilter)),
    [mapFilter, reports],
  )
  const selectedReport = visibleReports.find((report) => report.id === selectedReportId)
  const clusters = useMemo(() => buildClusters(visibleReports), [visibleReports])
  const radiusCenter = selectedReport && hasValidLocation(selectedReport)
    ? [selectedReport.location.lat, selectedReport.location.lng] as [number, number]
    : defaultCenter

  const requestUserLocation = useCallback(() => {
    setLocationMessage(null)

    if (!('geolocation' in navigator)) {
      setLocationMessage('Location is not available in this browser. You can still browse reports manually.')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setLocationMessage('Map centered on your approximate location.')
        setIsLocating(false)
      },
      () => {
        setLocationMessage('Location permission was not granted. The map is still fully usable.')
        setIsLocating(false)
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 8_000 },
    )
  }, [])

  const retryTiles = useCallback(() => {
    setMapError(null)
    setTileLayerKey((current) => current + 1)
  }, [])

  return (
    <div className="pawlink-map-shell pawlink-report-map">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom
        className="w-full"
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          key={tileLayerKey}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            tileerror: () => setMapError('Map tiles could not load. Reports and filters still work.'),
            tileload: () => setMapError(null),
          }}
        />
        <InvalidateMapSize />
        <FitInitialBounds reports={visibleReports} />
        <FlyToSelected report={selectedReport} />
        <FlyToUserLocation location={userLocation} />
        <MapControls
          reports={visibleReports}
          selectedReport={selectedReport}
          onLocate={requestUserLocation}
          onRetry={retryTiles}
          isLocating={isLocating}
          hasError={Boolean(mapError)}
        />

        <Circle
          center={radiusCenter}
          radius={searchRadiusMeters}
          pathOptions={{ color: '#7c3aed', fillColor: '#7c3aed', fillOpacity: 0.045, opacity: 0.32, weight: 2, dashArray: '8 8' }}
        />

        {clusters.map((cluster) => {
          if (cluster.reports.length > 1) {
            return <ClusterMarker key={cluster.id} cluster={cluster} onSelectReport={onSelectReport} />
          }

          const report = cluster.reports[0]
          const selected = selectedReportId === report.id
          const hovered = hoveredReportId === report.id
          return (
            <ReportMarker
              key={report.id}
              report={report}
              selected={selected}
              hovered={hovered}
              onSelect={() => onSelectReport(report)}
              onHoverChange={(isHovered) => setHoveredReportId(isHovered ? report.id : null)}
            />
          )
        })}

        {userLocation ? (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={850}
              pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.08, opacity: 0.35, weight: 2 }}
            />
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userLocationIcon}
              title="Your approximate location"
              alt="Your approximate location"
            >
              <Popup>Your approximate location</Popup>
            </Marker>
          </>
        ) : null}
      </MapContainer>

      <FloatingMapFilters value={mapFilter} onChange={setMapFilter} count={visibleReports.length} />

      {mapError ? (
        <div className="pawlink-map-overlay bottom-3 left-3 right-3 rounded-2xl border border-amber-200 bg-white/95 p-3 text-xs font-bold leading-5 text-amber-700 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <span>{mapError}</span>
            <button type="button" onClick={retryTiles} className="rounded-full bg-amber-100 px-3 py-1 font-black text-amber-800">
              Retry
            </button>
          </div>
        </div>
      ) : null}

      <div className="pawlink-map-legend">
        <div><span className="pawlink-map-legend-dot pawlink-map-legend-lost" /> Lost</div>
        <div className="mt-1"><span className="pawlink-map-legend-dot pawlink-map-legend-found" /> Found</div>
        <div className="mt-1"><span className="pawlink-map-legend-ring" /> Search radius</div>
        {userLocation ? <div className="mt-1 text-violet-700">◎ Your area</div> : null}
      </div>

      <div className="pawlink-map-overlay pointer-events-none left-3 right-3 top-3 flex items-start justify-between gap-3">
        <div />
        <div className="pointer-events-none flex flex-col items-end gap-2">
          {locationMessage ? (
            <div className="max-w-[240px] rounded-2xl border border-white/80 bg-white/95 p-3 text-xs font-bold leading-5 text-slate-600 shadow-sm backdrop-blur">
              {locationMessage}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
