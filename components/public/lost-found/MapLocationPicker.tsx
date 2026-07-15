import dynamic from 'next/dynamic'
import { LoadingState } from '@/components/shared/LoadingState'
import type { SelectedLocation } from '@/components/public/lost-found/types'

const LocationPickerMap = dynamic(() => import('@/components/public/lost-found/map/LocationPickerMap'), {
  ssr: false,
  loading: () => (
    <div className="pawlink-map-shell pawlink-picker-map">
      <LoadingState label="Loading map picker" />
    </div>
  ),
})

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
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-700">{label}</p>
      </div>
      <div className="mt-3">
        <LocationPickerMap value={value} onChange={onChange} label={label} />
      </div>
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
