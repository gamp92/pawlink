import type { MouseEvent } from 'react'
import { defaultReportLocation, type SelectedLocation } from '@/components/public/lost-found/types'

const baseLat = 19.4133
const baseLng = -99.1718
const latSpan = 0.018
const lngSpan = 0.026

function locationFromPercent(mapX: number, mapY: number): SelectedLocation {
  const lat = baseLat + ((50 - mapY) / 100) * latSpan
  const lng = baseLng + ((mapX - 50) / 100) * lngSpan
  return {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    label: 'Pinned community location',
    mapX,
    mapY,
  }
}

export function MapLocationPicker({
  value,
  onChange,
  error,
  label = 'Select location',
}: {
  value: SelectedLocation | null
  onChange: (location: SelectedLocation | null) => void
  error?: string
  label?: string
}) {
  function handleMapClick(event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const mapX = Math.round(((event.clientX - rect.left) / rect.width) * 100)
    const mapY = Math.round(((event.clientY - rect.top) / rect.height) * 100)
    onChange(locationFromPercent(Math.max(4, Math.min(96, mapX)), Math.max(4, Math.min(96, mapY))))
  }

  const marker = value ?? defaultReportLocation

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-700">{label}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange(defaultReportLocation)}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm transition hover:border-violet-200 hover:text-violet-700"
          >
            Use my location
          </button>
          {value ? (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm transition hover:border-rose-200 hover:text-rose-600"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={handleMapClick}
        className="relative mt-3 min-h-[360px] w-full overflow-hidden rounded-[1.75rem] border border-teal-100 bg-teal-50 text-left shadow-xl shadow-teal-100/60 transition hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-violet-100"
        aria-label="Choose a location on the map"
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,118,110,.12)_1px,transparent_1px),linear-gradient(rgba(15,118,110,.12)_1px,transparent_1px)] bg-[size:72px_72px]" />
        <div className="absolute left-[18%] top-[20%] h-20 w-32 rounded-2xl bg-teal-100/70" />
        <div className="absolute left-[55%] top-[26%] h-24 w-28 rounded-2xl bg-white/40" />
        <div className="absolute left-[18%] top-[30%] h-36 w-36 rounded-full border border-dashed border-rose-500/80" />
        <div className="absolute left-[42%] top-[12%] h-[76%] w-2 rounded-full bg-white/70" />
        <div className="absolute left-[8%] top-[58%] h-2 w-[84%] rounded-full bg-white/70" />
        <div
          className="absolute grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 animate-pulse place-items-center rounded-full border-4 border-white bg-violet-600 text-xs font-black text-white shadow-xl shadow-violet-300"
          style={{ left: `${marker.mapX}%`, top: `${marker.mapY}%` }}
        >
          Pin
        </div>
      </button>
      <div className="mt-3 rounded-2xl border border-teal-100 bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm">
        {value ? (
          <>
            <span className="font-black text-teal-800">{value.label}</span>
            <span className="mt-1 block text-xs text-slate-500">
              Approximate area selected near {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
            </span>
          </>
        ) : (
          'Tap the map to place the report pin.'
        )}
      </div>
      {error ? <p className="mt-1 text-xs font-bold text-rose-600">{error}</p> : null}
    </div>
  )
}
