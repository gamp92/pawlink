'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import type { LatLngExpression, LeafletEvent, LeafletMouseEvent, Marker as LeafletMarker } from 'leaflet'
import { Button } from '@/components/shared/Button'
import type { SelectedLocation } from '@/components/public/lost-found/types'
import {
  configureLeafletDefaultIcons,
  pickerMarkerIcon,
  userLocationIcon,
} from '@/components/public/lost-found/map/leaflet-icons'

const defaultCenter: [number, number] = [19.4133, -99.1718]
const defaultZoom = 14

type LocationPickerMapProps = {
  value: SelectedLocation | null
  onChange: (location: SelectedLocation | null) => void
  label: string
}

type UserLocation = {
  lat: number
  lng: number
}

function selectedLocationFromLatLng(lat: number, lng: number, label = 'Pinned community location'): SelectedLocation {
  return {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    label,
    mapX: 50,
    mapY: 50,
  }
}

function ClickHandler({ onPick }: { onPick: (event: LeafletMouseEvent) => void }) {
  useMapEvents({
    click: onPick,
  })

  return null
}

function MapCenterSync({ center }: { center: LatLngExpression }) {
  const map = useMap()

  useEffect(() => {
    map.flyTo(center, Math.max(map.getZoom(), 15), { duration: 0.55 })
  }, [center, map])

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

export default function LocationPickerMap({ value, onChange, label }: LocationPickerMapProps) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [locationMessage, setLocationMessage] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  useEffect(() => {
    configureLeafletDefaultIcons()
  }, [])

  const selectedPosition = useMemo<LatLngExpression | null>(
    () => (value ? [value.lat, value.lng] : null),
    [value],
  )

  const center = selectedPosition ?? (userLocation ? [userLocation.lat, userLocation.lng] as LatLngExpression : defaultCenter)

  const handlePick = useCallback(
    (event: LeafletMouseEvent) => {
      onChange(selectedLocationFromLatLng(event.latlng.lat, event.latlng.lng))
    },
    [onChange],
  )

  const handleDragEnd = useCallback(
    (event: LeafletEvent) => {
      const marker = event.target as LeafletMarker
      const position = marker.getLatLng()
      onChange(selectedLocationFromLatLng(position.lat, position.lng, value?.label ?? 'Pinned community location'))
    },
    [onChange, value?.label],
  )

  const requestUserLocation = useCallback(() => {
    setLocationMessage(null)

    if (!('geolocation' in navigator)) {
      setLocationMessage('Location is not available in this browser. You can still place the pin manually.')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = selectedLocationFromLatLng(
          position.coords.latitude,
          position.coords.longitude,
          'Your approximate location',
        )
        setUserLocation({ lat: nextLocation.lat, lng: nextLocation.lng })
        onChange(nextLocation)
        setLocationMessage('Pin placed near your approximate location.')
        setIsLocating(false)
      },
      () => {
        setLocationMessage('Location permission was not granted. Tap the map to place the pin manually.')
        setIsLocating(false)
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 8_000 },
    )
  }, [onChange])

  return (
    <div className="pawlink-map-shell pawlink-picker-map">
      <MapContainer center={defaultCenter} zoom={defaultZoom} scrollWheelZoom className="w-full" style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            tileerror: () => setMapError('Map tiles could not load. You can still use the form and try again.'),
            tileload: () => setMapError(null),
          }}
        />
        <InvalidateMapSize />
        <ClickHandler onPick={handlePick} />
        <MapCenterSync center={center} />
        {selectedPosition ? (
          <Marker
            position={selectedPosition}
            icon={pickerMarkerIcon}
            draggable
            title={`${label} pin`}
            alt={`${label} pin`}
            eventHandlers={{ dragend: handleDragEnd }}
          />
        ) : null}
        {userLocation ? (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userLocationIcon}
            title="Your approximate location"
            alt="Your approximate location"
          />
        ) : null}
      </MapContainer>

      <div className="pawlink-map-overlay pointer-events-none left-3 right-3 top-3 flex items-start justify-between gap-3">
        <div className="rounded-2xl border border-white/80 bg-white/90 px-3 py-2 text-xs font-black text-slate-700 shadow-sm backdrop-blur">
          Tap the map or drag the pin
        </div>
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <Button type="button" onClick={requestUserLocation} size="sm" variant="secondary" disabled={isLocating}>
            {isLocating ? 'Locating...' : 'Use my location'}
          </Button>
          {value ? (
            <Button type="button" onClick={() => onChange(null)} size="sm" variant="secondary">
              Clear location
            </Button>
          ) : null}
        </div>
      </div>

      {locationMessage ? (
        <div className="pawlink-map-overlay bottom-3 left-3 right-3 rounded-2xl border border-white/80 bg-white/95 p-3 text-xs font-bold leading-5 text-slate-600 shadow-sm backdrop-blur">
          {locationMessage}
        </div>
      ) : null}
      {mapError ? (
        <div className="pawlink-map-overlay bottom-3 left-3 right-3 rounded-2xl border border-amber-200 bg-white/95 p-3 text-xs font-bold leading-5 text-amber-700 shadow-sm backdrop-blur">
          {mapError}
        </div>
      ) : null}
    </div>
  )
}
